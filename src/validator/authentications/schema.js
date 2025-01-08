const Joi = require('joi');

const PostAuthenticationPayloadSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

/*
Sebenarnya PUT dan DELETE memiliki skema yang sama,
tapi bukan ide yang baik bila hanya menggunakan PUT skema untuk DELETE skema maupun sebaliknya.
Karena bisa suatu saat kita membutuhkan payload yang berbeda antara PUT dan DELETE,
maka kita tidak bisa menggunakan satu skema yang sama lagi.
*/
const PutAuthenticationPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

const DeleteAuthenticationPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = {
  PostAuthenticationPayloadSchema,
  PutAuthenticationPayloadSchema,
  DeleteAuthenticationPayloadSchema,
};
