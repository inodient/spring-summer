module.exports.uploadFile = uploadFile;
module.exports.downloadFile = downloadFile;




const path = require( "path" );
const fs = require( "fs" );

const Busboy = require( "busboy" );
const mime = require( "mime" );
const common = require( __common );

const submodule = require( __fileSubmodule );
const fileInfo = require( __fileHandlerInfo );





function uploadFile( req ){

  if( req.headers["content-type"] ){

    var destDir = _getUploadDestination( arguments );

    return new Promise( function(resolve, reject){

      logger.info( "destDir : ", destDir );

      try{
        var busboy = new Busboy({ headers: req.headers });
        var resultObject = {};
        resultObject.originalFileName = "";

        busboy.on( "file", function(fieldname, file, filename, encoding, mimetype){

          try{
            resultObject.destDir = destDir;
            resultObject.fieldname = fieldname;
            resultObject.file = file;
            resultObject.originalFileName += filename + "\n";
            resultObject.savedFileName = submodule.getSavedFileName() + "_" + filename;
            resultObject.encoding = encoding;
            resultObject.mimetype = mimetype;

            var saveTo = path.join( destDir, resultObject.savedFileName );
            file.pipe(fs.createWriteStream(saveTo));

            logger.info( "Uploading : " + saveTo);

          } catch( err ){
            console.log( "\x1b[31m%s\x1b[0m", "[summer-mvc core]", "[fileHandler.js]", err );
            throw err;
          }
        });

        busboy.on( "finish", function() {
          logger.info( "Upload complete" );
          resolve( resultObject );
        });

        busboy.on( "error", function(err){
          logger.error( err );
          console.log( "\x1b[31m%s\x1b[0m", "[summer-mvc core]", "[fileHandler.js]", err );
          reject( err );
        });

        req.pipe(busboy);

      } catch(err){
        logger.error( "BUSBOY Catch an ERROR when Upload File.", err );
        console.log( "\x1b[31m%s\x1b[0m", "[summer-mvc core]", "[fileHandler.js]", err );
        reject( err );
      }
    } );
  }
}

function downloadFile( res, savedPath, savedFileName, originalFileName ){
  return new Promise( function(resolve, reject){

    _setDownloadResponse( res, savedPath, savedFileName, originalFileName )
    .then( function(response){

      let fileSize, dest, mimeType;

      savedPath = path.join( __runningPath, savedPath );
      dest = path.join( savedPath, savedFileName );
      mimeType = mime.lookup( dest );



      var fileStream = fs.createReadStream( dest );
      fileStream.pipe( response );

      fileStream.on( "data", function(){
    	  logger.info( "Downloading : " + savedFileName );
      });

      fileStream.on( "close", function(){
        logger.info( "Download Complete" );
        // resolve( { "originalFileName" : originalFileName, "savedPath" : savedPath, "savedFileName" : savedFileName } );
      });

    } )
    .catch( function(err){
      console.log( "\x1b[31m%s\x1b[0m", "[summer-mvc core]", "[fileHandler.js]", err );
      reject( err );
    } );
  } );
}




function _getUploadDestination( arguments ){

  try {
    logger.info( fileInfo[ "default-path" ] );

    var defaultPath = path.join( fileInfo[ "default-path" ] ).split( path.sep );
    var destDir = __runningPath;

    if( fileInfo["default-pre-path"] && fileInfo["default-pre-path"] != "" ){
      destDir = fileInfo[ "default-pre-path" ];
      defaultPath = path.join( fileInfo[ "default-path" ] ).split( path.sep );
    }

    for( var i=0; i<defaultPath.length; i++ ){
      if( defaultPath[i] != "" ){
        destDir = path.join( destDir, defaultPath[i] );
        logger.info( destDir );
        common.makeFolder( destDir );
      }
    }

    for( var i=1; i<arguments.length; i++ ){
      destDir = path.join( destDir, arguments[i].toString() );
      common.makeFolder( destDir );
    }

    return destDir;
  } catch( err ){
    console.log( "\x1b[31m%s\x1b[0m", "[summer-mvc core]", "[fileHandler.js]", err );
    throw err;
  }
}

function _setDownloadResponse( res, savedPath, savedFileName, originalFileName ){
  return new Promise( function(resolve, reject){
    try{
      let fileSize, dest, mimeType;

      savedPath = path.join( __runningPath, savedPath );
      dest = path.join( savedPath, savedFileName );
      mimeType = mime.lookup( dest );

      res.setHeader( "content-disposition", "attachment;filename=" + originalFileName );
      res.setHeader( "content-Transfer-Encoding", "binary" );
      res.setHeader( "content-type", mimeType );

      resolve( res );

    } catch( err ){
      console.log( "\x1b[31m%s\x1b[0m", "[summer-mvc core]", "[fileHandler.js]", err );
      reject( err );
    }
  } );
}
