/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const AuthenticationError = require('../../exceptions/AuthenticationError');

class UsersService {
  constructor() {
    this._pool = new Pool();
  }

  async addUser({ username, password, fullname }) {
    // Verifikasi username di database, pastikan belum terdaftar.
    await this.verifyNewUsername(username);

    // Bila verifikasi lolos, maka masukkan user baru ke database.
    const id = `user-${nanoid(16)}`;
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = {
      text: 'INSERT INTO users VALUES($1, $2, $3, $4) RETURNING id',
      values: [id, username, hashedPassword, fullname],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) { // Bila 0 maka gagal memasukkan user baru
      throw new InvariantError('User gagal ditambahkan');
    }

    return result.rows[0].id; // butuh userId untuk mengisi nilai variable currentUserId
  }

  async verifyNewUsername(username) {
    const query = {
      text: 'SELECT username FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);

    if (result.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan user. Username sudah digunakan.');
    }
  }

  async getUserById(userId) {
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE id = $1',
      values: [userId],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('User tidak ditemukan');
    }

    return result.rows[0];
  }

  async verifyUserCredential(username, password) {
    const query = {
      text: 'SELECT id, password FROM users WHERE username = $1',
      values: [username],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    /*
    Dapatkan id dan password,
    nilai password, di tampung ke var hashedPassword,
    agar tidak ambigu dengan variabel password di parameter.
    */
    const { id, password: hashedPassword } = result.rows[0];

    // Compare hashedPassword yang ada di db, dgn password pada parameter
    const match = await bcrypt.compare(password, hashedPassword);

    if (!match) {
      throw new AuthenticationError('Kredensial yang Anda berikan salah');
    }

    return id; // id untuk membuat access dan refresh token (artifact payload)
  }

  async getUsersByUsername(username) {
    /*
    Kueri untuk mendapatkan users (id, username, dan fullname)
    yang username-nya mengandung kata yang diberikan pada parameter username.
    Untuk melakukannya, gunakan LIKE expressions.
    */
    const query = {
      text: 'SELECT id, username, fullname FROM users WHERE username LIKE $1',
      values: [`%${username}%`], // Maka akan jadi sepeti ini contoh: %bebek%
    };
    const result = await this._pool.query(query);
    return result.rows;
  }
}

module.exports = UsersService;
