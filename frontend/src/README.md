# Frontend source

`main.jsx` mount React và `index.css` chứa style chung.

- [app/](app/README.md): router, layout và providers.
- [features/](features/README.md): màn hình/nghiệp vụ.
- [shared/](shared/README.md): HTTP, session context, hooks và UI dùng chung.
- [assets/](assets/README.md): ảnh được bundle.

Feature dùng public shared APIs; không SQL, secrets hoặc authorization quyết định ở client.
