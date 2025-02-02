/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const mapDBToModel = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthorizationError = require('../../exceptions/AuthorizationError');

class NotesService {
  /*
  Menambahkan dependency terhadap CollaborationsService di dalam NotesService,
  menggunakan teknik dependency injection
  source: https://www.dicoding.com/academies/271/tutorials/17418
  */
  constructor(collaborationService, cacheService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
    this._cacheService = cacheService;
  }

  async addNote({
    title, body, tags, owner,
  }) {
    const id = nanoid(16);
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO notes VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      values: [id, title, body, tags, createdAt, updatedAt, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Catatan gagal ditambahkan');
    }

    await this._cacheService.delete(`notes:${owner}`);
    return result.rows[0].id;
  }

  async getNotes(owner) {
    try {
      // mendapatkan catatan dari cache
      const result = await this._cacheService.get(`notes:${owner}`);
      return JSON.parse(result);
    } catch (error) {
      // bila gagal, diteruskan dengan mendapatkan catatan dari database
      /*
      Penjelasan Query:
      Mengambil seluruh kolom pada tabel notes,
      kemudian menggabungkan (LEFT JOIN) tabel notes dengan collaborations berdasarkan note_id,
      kemudian mengembalikan seluruh notes berdasarkan 2 kondisi dimana:
      - Semua catatan yang dimiliki oleh user (user adalah owner dari catatan).
      - Semua catatan yang user terlibat sebagai kolaborator (user adalah kolaborator dari catatan).
      GROUP BY (Mengelompokkan hasil berdasarkan kolom notes.id),
      Jadi GROUP BY berfungsi memastikan bahwa setiap note hanya muncul sekali,
      meskipun ada banyak kolaborator yang terhubung.
      */
      const query = {
        text: `SELECT notes.* FROM notes 
        LEFT JOIN collaborations ON collaborations.note_id = notes.id 
        WHERE notes.owner = $1 OR collaborations.user_id = $1
        GROUP BY notes.id`,
        values: [owner],
      };

      const result = await this._pool.query(query);
      const mappedResult = result.rows.map(mapDBToModel);

      // catatan akan disimpan pada cache sebelum fungsi getNotes dikembalikan
      await this._cacheService.set(`notes:${owner}`, JSON.stringify(mappedResult));

      return mappedResult;
    }
  }

  async getNoteById(id) {
    /*
    Untuk mendapatkan username dari pemilik catatan,
    Kita harus melakukan join tabel catatan dengan users,
    Kolom yang menjadi kunci dalam melakukan LEFT JOIN adalah users.id dengan notes.owner,
    Dengan begitu notes yang dihasilkan dari kueri tersebut akan memiliki properti username.
    */
    const query = {
      text: `SELECT notes.*, users.username
      FROM notes
      LEFT JOIN users ON users.id = notes.owner
      WHERE notes.id = $1`,
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Catatan tidak ditemukan');
    }

    return result.rows.map(mapDBToModel)[0];
  }

  async editNoteById(id, { title, body, tags }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE notes SET title = $1, body = $2, tags = $3, updated_at = $4 WHERE id = $5 RETURNING id, owner',
      values: [title, body, tags, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui catatan. Id tidak ditemukan');
    }

    const { owner } = result.rows[0];
    await this._cacheService.delete(`notes:${owner}`);
  }

  async deleteNoteById(id) {
    const query = {
      text: 'DELETE FROM notes WHERE id = $1 RETURNING id, owner',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Catatan gagal dihapus. Id tidak ditemukan');
    }

    const { owner } = result.rows[0];
    await this._cacheService.delete(`notes:${owner}`);
  }

  async verifyNoteOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM notes WHERE id = $1',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Catatan tidak ditemukan');
    }

    const note = result.rows[0];

    if (note.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  /*
  Fungsi verifyNoteAccess untuk verifikasi hak akses pengguna (userId) terhadap catatan (noteId),
  baik sebagai owner maupun collaboration.
  *Untuk lolos tahap verifikasi, pengguna haruslah seorang owner atau kolaborator dari catatan.
  */
  async verifyNoteAccess(noteId, userId) {
    try {
      //* Bila userId merupakan owner dari noteId maka ia lolos verfikasi
      await this.verifyNoteOwner(noteId, userId);
    } catch (error) {
      /*
      *Bila userId bukan owner dari noteId maka,
      *akan membangkitkan NotfoundError(stop) atau AuthorizationError(lanjut).

      *Bila error merupakan NotFoundError, maka langsung throw dengan error (NotFoundError),
      *dan tidak perlu memeriksa hak akses kolaborator karena catatannya memang tidak ada.
      */
      if (error instanceof NotFoundError) {
        throw error; // throw menyebabkan stop eksekusi kode
      }
      /*
      *Bila hasilnya AuthorizationError, maka lanjutkan ke block try selanjutnya
      *yaitu proses pemeriksaan hak akses kolaborator menggunakan fungsi verifyCollaborator.
      */

      try {
        //* Jika userId seorang kolaborator, maka proses verfikasi lolos
        await this._collaborationService.verifyCollaborator(noteId, userId);
      } catch {
        //* Jika userId bukan seorang kolaborator, maka throw AuthorizationError
        throw error; // throw menyebabkan stop eksekusi kode
      }
    }
  }
}

module.exports = NotesService;
