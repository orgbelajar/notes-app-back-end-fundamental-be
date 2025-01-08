/* eslint-disable no-unused-vars */
/* eslint-disable import/no-extraneous-dependencies */
const autoBind = require('auto-bind');

/* eslint-disable no-underscore-dangle */
class AuthenticationsHandler {
  constructor(authenticationsService, usersService, tokenManager, validator) {
    this._authenticationsService = authenticationsService;
    this._usersService = usersService;
    this._tokenManager = tokenManager;
    this._validator = validator;

    autoBind(this);
  }

  async postAuthenticationHandler(request, h) {
    this._validator.validatePostAuthenticationPayload(request.payload);

    // Cek/verifikasi kredensial pada req.payload
    const { username, password } = request.payload;
    const id = await this._usersService.verifyUserCredential(username, password);

    // Buat access dan refresh token setelah verifikasi kredensial selesai
    const accessToken = this._tokenManager.generateAccessToken({ id });
    const refreshToken = this._tokenManager.generateRefreshToken({ id });

    // Save refresh token ke tabel users di db notesapp
    await this._authenticationsService.addRefreshToken(refreshToken);

    const response = h.response({
      status: 'success',
      message: 'Authentication berhasil ditambahkan',
      data: {
        accessToken,
        refreshToken,
      },
    });
    response.code(201);
    return response;
  }

  async putAuthenticationHandler(request, h) {
    this._validator.validatePutAuthenticationPayload(request.payload);

    const { refreshToken } = request.payload;
    // Verifikasi dari sisi database
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    // Verifikasi dari sisi signature token
    const { id } = this._tokenManager.verifyRefreshToken(refreshToken);

    /*
    Setelah refreshToken lolos dari verifikasi database dan signature,
    sekarang kita bisa secara aman membuat accessToken baru
    dan melampirkannya sebagai data di body respons.
    */
    const accessToken = this._tokenManager.generateAccessToken({ id });
    return {
      status: 'success',
      message: 'Access Token berhasil diperbarui',
      data: {
        accessToken,
      },
    };
  }

  async deleteAuthenticationHandler(request, h) {
    this._validator.validateDeleteAuthenticationPayload(request.payload);

    // Setelah di validasi, dapatkan nilai refreshToken dari req payload
    const { refreshToken } = request.payload;
    // Memastikan refreshToken ada di database tabel users
    await this._authenticationsService.verifyRefreshToken(refreshToken);
    // Setelah verifikasi token ada di db, maka hapus refreshToken dari db
    await this._authenticationsService.deleteRefreshToken(refreshToken);

    return {
      status: 'success',
      message: 'Refresh token berhasil dihapus',
    };
  }
}

module.exports = AuthenticationsHandler;
