# PaperNest API Documentation

## Commit & Review Flow (Strict Mode)

Dokumen ini berisi daftar endpoint API yang digunakan untuk alur kerja Student (Mahasiswa) dan Lecturer (Dosen) dalam sistem PaperNest, khususnya terkait fitur Versioning (Commit) dan Review.

---

## 1. Student Flow (Mahasiswa)

### A. Initial Load & Logic Pengecekan

Mahasiswa membuka dokumen dan sistem mengecek apakah boleh melakukan commit baru.

**1. Get Current Version**
Mengambil informasi versi terakhir dari dokumen.

- **Method:** `GET`
- **URL:** `/api/documents/:documentId/versions/current`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "version": {
        "documentBodyId": "ver_123",
        "versionNumber": 1,
        "content": "...",
        "isCurrentVersion": true
      }
    }
  }
  ```

**2. Get Document Reviews**
Mengambil daftar review untuk mengecek status terakhir.

- **Method:** `GET`
- **URL:** `/api/documents/:documentId/reviews`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "reviews": [
        {
          "reviewId": "rev_abc",
          "status": "pending",
          "requestedAt": "2023-10-27T10:00:00Z"
        }
      ]
    }
  }
  ```
- **Client Logic:** Jika review terbaru statusnya `pending`, tombol **Commit** harus dinonaktifkan (disabled).

---

### B. Create Version (Commit)

Jika tidak ada _pending review_, mahasiswa boleh membuat versi baru.

**3. Create New Version**

- **Method:** `POST`
- **URL:** `/api/documents/:documentId/versions`
- **Body:**
  ```json
  {
    "content": "Updated HTML content string...",
    "message": "Update Bab 1: Penambahan Latar Belakang"
  }
  ```

---

### C. Request Review

Mahasiswa meminta dosen untuk mereview versi tertentu.

**4. Create Review Request**

- **Method:** `POST`
- **URL:** `/api/documents/:documentId/versions/:documentBodyId/reviews`
- **URL Params:**
  - `documentId`: ID Dokumen
  - `documentBodyId`: ID Versi (didapat dari response Get Version / Create Version)
- **Body:**
  ```json
  {
    "lecturerUserId": "user_lecturer_123",
    "message": "Mohon direview Pak, saya sudah perbaiki Bab 1."
  }
  ```

---

### D. Rollback (Restore)

Mengembalikan dokumen ke versi sebelumnya.

**5. Revert to Version**

- **Method:** `POST`
- **URL:** `/api/documents/:documentId/versions/:versionNumber/revert`
- **Response:** Akan membuat versi baru yang isinya sama dengan versi lama yang dipilih.

---

## 2. Lecturer Flow (Dosen)

### A. Dashboard & Monitoring

**6. Get Pending Reviews**
Melihat daftar dokumen yang menunggu review.

- **Method:** `GET`
- **URL:** `/api/reviews/pending`
- **Response:** List review dengan status `pending` yang ditujukan ke dosen tersebut.

---

### B. Review Actions (Approval)

Dosen memberikan status pada review.

**7. Approve Review**
Menyetujui dokumen (Mahasiswa bisa lanjut commit lagi).

- **Method:** `POST`
- **URL:** `/api/reviews/:reviewId/approve`
- **Body:**
  ```json
  {
    "message": "Sudah oke, silakan lanjut Bab 2."
  }
  ```

**8. Reject Review**
Menolak dokumen.

- **Method:** `POST`
- **URL:** `/api/reviews/:reviewId/reject`
- **Body:**
  ```json
  {
    "message": "Masih banyak typo dan format salah. Perbaiki."
  }
  ```

**9. Request Revision**
Meminta revisi (Status: `revision_required`).

- **Method:** `POST`
- **URL:** `/api/reviews/:reviewId/request-revision`
- **Body:**
  ```json
  {
    "message": "Tambahkan referensi jurnal terbaru."
  }
  ```

---

## 3. Data Types Reference

**Review Status:**

- `pending`: Menunggu respon dosen (Blocker commit).
- `approved`: Disetujui (Unblock commit).
- `rejected`: Ditolak.
- `revision_required`: Perlu revisi.
