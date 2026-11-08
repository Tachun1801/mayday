# App

`App.jsx` lắp BrowserRouter/SessionProvider và hai workspace. Public `/login`, `/register`, `/system`; staff `/patients` (new/first-contact/detail), `/medical-records` (detail/visit), `/facilities`, `/drugs`, `/profile`, `/admin`; patient `/portal` (records/detail/uas/profile).

Guard dựa session/subtype: patient-only về portal, staff-only không vào portal; dual identity có link chuyển khu vực. Có skip link, 404 và logout thiết bị. Guard chỉ phục vụ UX; backend vẫn kiểm tra capability/resource scope. Tests session/render và browser opt-in.
