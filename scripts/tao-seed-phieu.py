#!/usr/bin/env python3
"""Sinh seeds/003_customers.sql và seeds/004_tickets.sql từ bộ dữ liệu mẫu Mekong Mobile.

Cách dùng:  python scripts/tao-seed-phieu.py <thư-mục-dataset> [thư-mục-seeds]
Không cần chạy lại khi chỉ chạy dự án: hai tệp .sql đã được commit. Tệp này chỉ để truy vết cách chọn và làm sạch dữ liệu (TD-21).

Quy tắc chọn và làm sạch:
  1. Chỉ lấy phiếu ĐANG MỞ (DA_PHAN_CONG, DANG_XU_LY, CHO_LINH_KIEN): L4 chỉ cần phiếu đang giữ để tính khối lượng KTV.
  2. Số điện thoại chuẩn hóa theo QT-02: bỏ ký tự không phải số, "+84"/"84" -> "0"; phải đủ 10 số bắt đầu bằng 0.
     Khách không có số hợp lệ -> bỏ phiếu của khách đó (cột phone của ERD là NOT NULL).
  3. Nhiều bản ghi khách trùng một số điện thoại -> gộp về bản ghi có mã nhỏ nhất (cột phone là UNIQUE).
  4. Chuyển 12 phiếu mở nhận gần nhất (2 phiếu mỗi trung tâm) về trạng thái MOI, bỏ KTV: dữ liệu mẫu không có phiếu MOI nào
     mà luồng chính UC3 bắt đầu từ phiếu MOI.
"""
import csv, re, sys, collections, pathlib

ds = pathlib.Path(sys.argv[1])
out = pathlib.Path(sys.argv[2] if len(sys.argv) > 2 else 'seeds')
MO = ('DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN')
doc = lambda ten: list(csv.DictReader(open(ds / ten, encoding='utf-8')))

def chuan_hoa(p):
    d = re.sub(r'\D', '', p or '')
    if d.startswith('84') and len(d) == 11:
        d = '0' + d[2:]
    return d if re.fullmatch(r'0\d{9}', d) else None

q = lambda s: "'" + s.replace("'", "''") + "'"
khach = {r['record_id']: r for r in doc('customers_raw.csv')}
nhom = {r['category_id']: r['category_name'] for r in doc('issue_categories.csv')}
may = {r['product_id']: r['product_name'] for r in doc('products.csv')}

phieu = [r for r in doc('tickets_history.csv') if r['status'] in MO]
dt_goc = {}                      # số điện thoại -> mã khách nhỏ nhất
for i in sorted({r['customer_id'] for r in phieu}, key=int):
    sdt = chuan_hoa(khach[i]['so_dien_thoai'])
    if sdt:
        dt_goc.setdefault(sdt, i)
ma_khach = {i: dt_goc[chuan_hoa(khach[i]['so_dien_thoai'])]
            for i in {r['customer_id'] for r in phieu} if chuan_hoa(khach[i]['so_dien_thoai'])}
phieu = [r for r in phieu if r['customer_id'] in ma_khach]

moi, dem = set(), collections.Counter()
for r in sorted(phieu, key=lambda r: r['received_at'], reverse=True):
    if r['status'] == 'DA_PHAN_CONG' and dem[r['center_id']] < 2:
        dem[r['center_id']] += 1
        moi.add(r['ticket_id'])

dong = []
for sdt, i in sorted(dt_goc.items(), key=lambda kv: int(kv[1])):
    k = khach[i]
    dong.append(f"  ({i}, {q(k['ho_ten'].strip())}, {q(sdt)}, {q(k['ngay_tao'] + ' 00:00:00+07')})")
(out / '003_customers.sql').write_text(
    "-- Sinh bởi scripts/tao-seed-phieu.py (TD-21). Khách của các phiếu đang mở; số điện thoại đã chuẩn hóa QT-02.\n"
    "INSERT INTO customer (customer_id, full_name, phone, created_at) VALUES\n" + ",\n".join(dong) +
    "\nON CONFLICT DO NOTHING;\n"
    "SELECT setval(pg_get_serial_sequence('customer', 'customer_id'), (SELECT max(customer_id) FROM customer));\n",
    encoding='utf-8')

dong = []
for r in sorted(phieu, key=lambda r: int(r['ticket_id'])):
    m = r['ticket_id'] in moi
    kt = 'NULL' if m or not r['technician_id'] else r['technician_id']
    dong.append("  ({}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {})".format(
        r['ticket_id'], q(r['ticket_code']), ma_khach[r['customer_id']], r['center_id'],
        q(may[r['product_id']]), q(nhom[r['category_id']]), q(r['priority']),
        q('MOI' if m else r['status']), kt,
        q(r['received_at'] + ':00+07'), q(r['due_date'] + ':00+07')))
(out / '004_tickets.sql').write_text(
    "-- Sinh bởi scripts/tao-seed-phieu.py (TD-21). Phiếu đang mở; 12 phiếu nhận gần nhất của mỗi trung tâm (2/trung tâm) đặt lại MOI.\n"
    "INSERT INTO ticket (ticket_id, ticket_code, customer_id, center_id, device_name, issue_category, priority, status,\n"
    "                    technician_id, received_at, due_date) VALUES\n" + ",\n".join(dong) +
    "\nON CONFLICT DO NOTHING;\n"
    "SELECT setval(pg_get_serial_sequence('ticket', 'ticket_id'), (SELECT max(ticket_id) FROM ticket));\n",
    encoding='utf-8')
print(len(ma_khach), 'khach;', len(phieu), 'phieu;', len(moi), 'phieu MOI')
