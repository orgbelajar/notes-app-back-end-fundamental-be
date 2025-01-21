/* eslint-disable no-underscore-dangle */
const autoBind = require('auto-bind');
// const ClientError = require('../../exceptions/ClientError');

class UploadsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postUploadImageHandler(request, h) {
    const { data } = request.payload;
    this._validator.validateImageHeaders(data.hapi.headers);

    // eslint-disable-next-line max-len
    const filename = await this._service.writeFile(data, data.hapi); // ex. filename = (162121test.jpg)

    const response = h.response({
      status: 'success',
      data: {
        fileLocation: `http://${process.env.HOST}:${process.env.PORT}/upload/images/${filename}`,
      },
    });
    response.code(201);
    return response;
  }
}

module.exports = UploadsHandler;
