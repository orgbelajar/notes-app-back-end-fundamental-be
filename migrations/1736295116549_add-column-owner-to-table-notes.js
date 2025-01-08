/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  /*
  Berdasarkan dokumentasi dari node-pg-migrate,
  untuk menambahkan kolom pada tabel yang sudah ada,
  kita bisa menggunakan perintah pgm.addColumn.
  */
  pgm.addColumn('notes', {
    owner: {
      type: 'VARCHAR(50)',
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Untuk menghapusnya gunakan perintah pgm.dropColumn.
  pgm.dropColumn('notes', 'owner');
};
