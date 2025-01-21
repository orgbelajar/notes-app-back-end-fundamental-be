/* eslint-disable no-underscore-dangle */
const fs = require('fs');

class StorageService {
  constructor(folder) {
    this._folder = folder;

    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
  }

  // eslint-disable-next-line max-len
  writeFile(file, meta) { // (readale(payload), meta object(informasi dari berkas yang akan ditulis))
    // Nama berkas yang akan di tulis (write)
    const filename = +new Date() + meta.filename; // timestamp + nama file nya

    // Menampung path/alamat lengkap dari berkas yang akan di tulis
    const path = `${this._folder}/${filename}`; // basis folder + nama berkas

    // Membuat writeable stream
    const fileStream = fs.createWriteStream(path);

    /*
    Fungsi writeFile dibuat dengan mengembalikan Promise,
    sehingga proses penulisan berkas akan berjalan secara asynchronous.
    */
    return new Promise((resolve, reject) => {
      //* Executor Function Promise
      /*
      Jika penulisan berkas terjadi error,
      Promise akan menghasilkan reject dengan membawa error yang dihasilkan.
      */
      fileStream.on('error', (error) => reject(error));
      file.pipe(fileStream);
      /*
      Jika penulisan berhasil, maka Promise akan menghasilkan resolve,
      yang membawa nama berkas (filename) sebagai nilai kembalian.
      */
      file.on('end', () => resolve(filename));
    });
  }
}

module.exports = StorageService;
