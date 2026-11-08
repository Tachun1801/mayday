const bcrypt = require('bcryptjs');
const { HttpError } = require('../../shared/errors');
const { withTransaction } = require('../../database/transaction');
const validate = require('./administration-write.validation');
const { createAdministrationWriteRepository } = require('./administration-write.repository');
const denied = () => new HttpError(403, '3101', 'Permission denied');
function createAdministrationWriteService(pool, { hashPassword = (password) => bcrypt.hash(password, 12) } = {}) {
  async function run(principal, operation) {
    if (!principal?.staff_id || !principal?.account_id || !Array.isArray(principal.permissions)) throw denied();
    const accountId = validate.identifier(String(principal.account_id));
    if (!pool) throw new HttpError(503, '9902', 'Database connection unavailable');
    try {
      return await withTransaction(pool, async (client) => {
        const repository = createAdministrationWriteRepository(client);
        const actor = await repository.actor(accountId);
        if (!actor || actor.person_id !== String(principal.staff_id) || actor.role_id !== String(principal.role_id)) throw denied();
        if (!await repository.role(actor.role_id)) throw denied();
        const permissions = await repository.permissions(actor.role_id);
        const names = new Set(permissions.map((permission) => permission.name));
        if (!principal.permissions.every((permission) => names.has(permission))) throw denied();
        return operation(repository, actor, names);
      });
    } catch (error) {
      if (['23505', '40P01', '40001'].includes(error.code)) throw new HttpError(409, '2003', 'Administration data changed or conflicts');
      if (['23503', '23514', '23502', '22001'].includes(error.code)) throw validate.invalid();
      throw error;
    }
  }
  async function grantable(repository, roleId, names) {
    if (!await repository.role(roleId)) throw validate.invalid();
    const permissions = await repository.permissions(roleId);
    if (!permissions.every((permission) => names.has(permission.name))) throw denied();
  }
  return {
    async createStaff(principal, body) {
      const input = validate.staffInput(body);
      // Hash only validated input. No passwords/hashes are returned or logged.
      if (!principal?.staff_id) throw denied();
      const hash = await hashPassword(input.password);
      return run(principal, async (repository, actor, names) => {
        await grantable(repository, input.role_id, names);
        return repository.createStaff(input, actor, hash);
      });
    },
    async updateAccount(principal, id, body) {
      const targetId = validate.identifier(id), input = validate.accountPatch(body);
      return run(principal, async (repository, actor, names) => {
        if (targetId === actor.account_id && (Object.hasOwn(input, 'role_id') || Object.hasOwn(input, 'is_active'))) throw denied();
        const target = await repository.account(targetId, actor.branch_id);
        if (!target) throw new HttpError(404, null, 'Staff account not found');
        await grantable(repository, target.role_id, names);
        if (input.role_id) await grantable(repository, input.role_id, names);
        return repository.updateAccount(target, input);
      });
    },
    async createRole(principal, body) {
      validate.object(body, ['ten_vai_tro', 'ten_hien_thi', 'mo_ta_vai_tro']);
      const input = { ten_vai_tro: validate.text(body.ten_vai_tro, 50, true), ten_hien_thi: validate.text(body.ten_hien_thi, 100, true), mo_ta_vai_tro: validate.text(body.mo_ta_vai_tro, 8000) };
      return run(principal, (repository) => repository.createRole(input));
    },
    async replacePermissions(principal, id, body) {
      const roleId = validate.identifier(id);
      validate.object(body, ['permission_ids']);
      if (!Array.isArray(body.permission_ids) || body.permission_ids.length > 1000) throw validate.invalid();
      const ids = body.permission_ids.map(validate.identifier);
      if (new Set(ids).size !== ids.length) throw validate.invalid();
      return run(principal, async (repository, actor, names) => {
        if (roleId === actor.role_id) throw denied();
        if (!await repository.role(roleId, true)) throw new HttpError(404, null, 'Role not found');
        if (await repository.roleHasOtherScope(roleId, actor.branch_id)) throw denied();
        const previous = await repository.permissions(roleId);
        if (!previous.every((permission) => names.has(permission.name))) throw denied();
        const requested = await repository.permissionIds(ids);
        if (requested.length !== ids.length || !requested.every((permission) => names.has(permission.name))) throw denied();
        return repository.replacePermissions(roleId, ids, actor.person_id);
      });
    },
  };
}
module.exports = { createAdministrationWriteService };
