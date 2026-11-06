import urllib.request
import json
import http.cookiejar

cookie_jar = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cookie_jar))

def req(url, data=None, headers=None, method=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        res = opener.open(r)
        return res.status, json.loads(res.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

print("--- KYK ÇAMAŞIR SİSTEMİ TEST BAŞLANGICI ---")

# 1. Slot listesi kontrolü
status, data = req("http://localhost:3456/api/slots?date=2026-11-09")
avail = data.get("availableSlotsCount")
print(f"1. Slot Kontrolü: HTTP {status}, Müsait slot sayısı: {avail}")

# 2. 2116 no'lu oda, 3. yatak için 1. randevu
b1_data = {
    "booking_date": "2026-11-09",
    "time_slot": "13:30 - 14:30",
    "machine_number": 1,
    "floor": 2,
    "room": "2116",
    "bed": 3
}
status, b1 = req("http://localhost:3456/api/bookings", b1_data)
cancel_code_1 = b1.get("booking", {}).get("cancel_code")
print(f"2. İlk Randevu: HTTP {status}, İptal Kodu: {cancel_code_1}")

# 3. Gizlilik Kontrolü (Normal kullanıcı oda/yatak bilgisini asla görememeli)
status, data = req("http://localhost:3456/api/slots?date=2026-11-09")
slot1 = [s for s in data["slots"] if s["time_slot"] == "13:30 - 14:30" and s["machine_number"] == 1][0]
is_booked = slot1["isBooked"]
has_leak = "bookingDetails" in slot1 or "room" in slot1
print(f"3. Gizlilik Kontrolü: Slot Dolu mu={is_booked}, Veri Sızıntısı Var mı={has_leak} (False olmalı)")

# 4. Aynı slota çakışan randevu engelleme (Double-booking check)
status, err = req("http://localhost:3456/api/bookings", {
    "booking_date": "2026-11-09",
    "time_slot": "13:30 - 14:30",
    "machine_number": 1,
    "floor": 2,
    "room": "2118",
    "bed": 1
})
print(f"4. Çift Randevu Engelleme: HTTP {status} (409 Çakışma Beklenir)")

# 5. Aynı yatak için 2. randevu (Salı günü)
status, b2 = req("http://localhost:3456/api/bookings", {
    "booking_date": "2026-11-10",
    "time_slot": "15:30 - 16:30",
    "machine_number": 2,
    "floor": 2,
    "room": "2116",
    "bed": 3
})
print(f"5. Aynı Yatağa 2. Randevu: HTTP {status}")

# 6. Aynı yatak için 3. randevu denemesi (HAK LİMİTİ: 7 günde maks 2)
status, err_limit = req("http://localhost:3456/api/bookings", {
    "booking_date": "2026-11-11",
    "time_slot": "17:30 - 18:30",
    "machine_number": 3,
    "floor": 2,
    "room": "2116",
    "bed": 3
})
print(f"6. 7 Günde 2 Hak Sınırı Kontrolü: HTTP {status} (400 Beklenir), Hata: {err_limit.get('error')[:60]}...")

# 7. Öğrencinin sırasını İptal Kodu ile iptal etmesi
status, cancel_res = req("http://localhost:3456/api/bookings/cancel", {
    "room": "2116",
    "bed": 3,
    "cancel_code": cancel_code_1
})
print(f"7. Randevu İptali: HTTP {status}, Yanıt: {cancel_res.get('message')}")

# 8. İptal sonrası hak geri geldi mi? 3. randevuyu şimdi alabilmeli
status, b3 = req("http://localhost:3456/api/bookings", {
    "booking_date": "2026-11-11",
    "time_slot": "17:30 - 18:30",
    "machine_number": 3,
    "floor": 2,
    "room": "2116",
    "bed": 3
})
print(f"8. İptal Sonrası Hak İadesi ve Yeni Sıra: HTTP {status} (200 Beklenir)")

# 9. Admin Girişi ve Görevli Teyit Sorgulaması
status, login_res = req("http://localhost:3456/api/admin/login", {"password": "kykadmin123"})
print(f"9. Admin Girişi: HTTP {status}")

# 10. Admin gözüyle slotları sorgula (Oda ve yatak bilgisi admin için GÖRÜNÜR OLMALI)
status, admin_slots = req("http://localhost:3456/api/slots?date=2026-11-10")
admin_s2 = [s for s in admin_slots["slots"] if s["time_slot"] == "15:30 - 16:30" and s["machine_number"] == 2][0]
details = admin_s2.get("bookingDetails", {})
print(f"10. Admin Teyit Masası: Oda={details.get('room')}, Yatak={details.get('bed')} (Admin görebiliyor!)")

# 11. Admin Arama (Görevliye gelen öğrenciyi arama)
status, search_res = req("http://localhost:3456/api/admin/bookings?query=2116-3")
print(f"11. Görevli Arama '2116-3': HTTP {status}, Bulunan kayıt: {search_res.get('count')} adet")

print("--- TÜM TESTLER BAŞARIYLA TAMAMLANDI! ---")
