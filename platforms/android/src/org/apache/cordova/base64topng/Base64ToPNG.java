package org.apache.cordova.base64topng;

/**
* A phonegap plugin that converts a Base64 String to a PNG file.
*
* @author mcaesar
* @lincese MIT.
*/

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaPlugin;
import org.json.JSONArray;

import android.os.Environment;

import java.io.*;

import org.json.JSONException;
import org.json.JSONObject;
import util.Base64;

public class Base64ToPNG extends CordovaPlugin {

    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
        if (!action.equals("saveImage")) {
            return false;
        }
        try {
            String b64String = args.getString(0);
            if (b64String.startsWith("data:image")) {
                b64String = b64String.substring(b64String.indexOf(',') + 1);
            }
            JSONObject params = args.getJSONObject(1);

            //Optional parameter
            String filename = params.has("filename")
                    ? params.getString("filename")
                    : "drawsaur_" + System.currentTimeMillis() + ".png";

            String folder = params.has("folder")
                    ? params.getString("folder")
                    : Environment.getExternalStorageDirectory() + "/drawsaur";			
            Boolean overwrite = params.has("overwrite") 
                    ? params.getBoolean("overwrite") 
                    : false;

            Boolean returnFileName = params.has("returnFileName") 
                    ? params.getBoolean("returnFileName") 
                    : false;

            return this.saveImage(b64String, filename, folder, overwrite, callbackContext, returnFileName);
        } catch (JSONException e) {
            e.printStackTrace();
            callbackContext.error(e.getMessage());
            return false;
        } catch (InterruptedException e) {
            e.printStackTrace();
            callbackContext.error(e.getMessage());
            return false;
        }
    }
    //private boolean saveImage(String b64String, String fileName, String dirName, Boolean overwrite, CallbackContext callbackContext) throws InterruptedException, JSONException {
    //	return saveImage(b64String, fileName, dirName, overwrite, callbackContext, false);
    //}
    private boolean saveImage(String b64String, String fileName, String dirName, Boolean overwrite, CallbackContext callbackContext, Boolean returnFileName) throws InterruptedException, JSONException {
        try {
            //Directory and File
            File dir = new File(dirName);
            if (!dir.exists()) {
                dir.mkdirs();
            }
            File file = new File(dirName, fileName);
            //Avoid overwriting a file
            if (!overwrite && file.exists()) {
            	callbackContext.error("File already exists!");
                return true;
            }
            //Decode Base64 back to Binary format
            byte[] decodedBytes = Base64.decode(b64String.getBytes());
            //Save Binary file to phone
            file.createNewFile();
            FileOutputStream fOut = new FileOutputStream(file);
            fOut.write(decodedBytes);
            fOut.close();
            
            if (returnFileName)
            {
            	callbackContext.success(dirName + "/" + fileName);
            }
            else
            {
            	callbackContext.success("Saved successfully to " + dirName + "/" + fileName);
            }
        	return true;
        } catch (FileNotFoundException e) {
            callbackContext.error("File not Found!");
            return false;
        } catch (IOException e) {
            callbackContext.error(e.getMessage());
            return false;
        }
    }
}
