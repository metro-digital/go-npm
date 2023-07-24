const { join } = require('path');
const { existsSync, renameSync, chmodSync, createReadStream, createWriteStream, unlink } = require('fs');
const { getInstallationPath } = require('../common');
const { pipeline } = require('stream');

function verifyAndPlaceBinary(binName, binPath, callback) {
  if (!existsSync(join(binPath, binName))) {
    return callback(`Downloaded binary does not contain the binary specified in configuration - ${binName}`);
  }

  getInstallationPath((err, installationPath) => {
    if (err) {
      return callback(err);
    }

    // Move the binary file and make sure it is executable
    move(join(binPath, binName), join(installationPath, binName), (err) => {
      if (err) {
        return callback(err)
      }

      try {
        chmodSync(join(installationPath, binName), '755');
  
        console.log('Placed binary on', join(installationPath, binName));
        return callback(null);
      } catch (err) {
        return callback(err)
      }

    });
  });
}

function move(oldPath, newPath, callback) {
  try { 
    renameSync(oldPath, newPath)
    callback(null)
  } catch (err) {
    if (err) {
      if (err.code === 'EXDEV') {
        copy(oldPath, newPath, callback);
      } else {
        callback(err);
      }
      return
    }
  };
}

function copy(oldPath, newPath, callback) {
  const readStream = createReadStream(oldPath);
  const writeStream = createWriteStream(newPath);

  const cb = function (err) {
    err
      ? callback(err)
      : callback(null)
  }
  readStream.on('error', cb);
  writeStream.on('error', cb);

  readStream.on('close', function () {
    unlink(oldPath, cb);
  });

  pipeline(
    readStream,
    writeStream,
    cb
  )
}
module.exports = verifyAndPlaceBinary;
