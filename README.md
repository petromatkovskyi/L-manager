# l-manager

The main reason for creating the program is to automatize work on the Lidar project.
The app can help the user find new file names in a Google Spreadsheet. By setting the URLs of the project directory on the server and the target directory on the local machine, the user can very quickly and properly copy the files and make them ready for use by converting the .laz type to the .las type that MicroStation requires.
When processing files on MicroStation, the user may encounter the need to view adjacent files.
Thus, after downloading new files, the program prepares and saves the data so that the user can download neighboring files. The program saves the user from searching for the file name in the directory, copying, converting manually.
Preparing data for saving consists of collecting data that was used when uploading new files, such as URLs for downloading and saving files, links to a spreadsheet, etc. to use them in the next steps and create a scheme of available filenames. The program can build a file schema based on the nomenclature name type or the number-alphabet (which represent the X or Y axis). After creating a complete schema for available files, the program creates a schema for new files and neighboring files around them. Then saves the data to a json file.
After all these manipulations, the user gets the opportunity to conveniently select the necessary files on a 2D diagram or list and download files.

The main goal of the program is to relieve the user of the need to use Google Sheets and the file explorer
