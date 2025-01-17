const autoBind = require('auto-bind');

/* eslint-disable no-underscore-dangle */
class ExportsHandler {
  constructor(service, validator) {
    // masukkan masing-masing nilai parameter sebagai private property class
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postExportNotesHandler(request, h) {
    this._validator.validateExportNotesPayload(request.payload);

    const message = {
      userId: request.auth.credentials.id,
      targetEmail: request.payload.targetEmail,
    };

    // Kirim pesan tersebut ke queue
    /*
    Fungsi sendMessage hanya menerima message dalam bentuk string.
    Itulah mengapa perlu mengubah objek message dalam bentuk string menggunakan JSON.stringify.
    */
    await this._service.sendMessage('export:notes', JSON.stringify(message)); // export:notes’ sebagai nama queue-nya

    const response = h.response({
      status: 'success',
      message: 'Permintaan Anda dalam antrean',
    });
    response.code(201);
    return response;
  }
}

module.exports = ExportsHandler;
