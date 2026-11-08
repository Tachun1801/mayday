# Session context boundary

context.js cung cấp React context/useSession cho app, auth feature và shared request hooks. State/timer được sở hữu bởi SessionProvider ở auth feature; context không import feature hoặc giữ token trên disk. Không quyết định quyền backend.
