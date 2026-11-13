// Lệnh gọi API đăng nhập (POST /api/auth/login, công khai). Token do máy chủ cấp; mật khẩu không bao giờ được lưu ở trình duyệt.
import { goi } from './client.js';

/** @returns {Promise<{token:string, token_type:string, expires_in:number, user:{user_id:number, username:string, full_name:string, role:string, center_id:number|null}}>} */
export const dangNhap = (username, password) => goi('/api/auth/login', { method: 'POST', body: { username, password } });
