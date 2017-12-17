# Devpost Stats CLI

> Get stats about your hackathon from the comfort of your terminal :rocket:

## Description

Given a CSV of exported [Devpost](https://devpost.com) data, this CLI generates the following statistics:
- The number of submissions
- The count of schools associated with submissions
- The count of technologies used to build the submissions
- The count of submissions for each prize

## Install

Ensure you have Node.js version 8+ installed. Then run the following:

```bash
$ npm install --global @qhacks/devpost-stats-cli
```
   
## Usage

```
$ devpost-stats --help

  Usage
    $ devpost-stats <csv>
      
  Options
    --output-file, -o  Specify a path and JSON file to save the statistics to
    
  Examples
    $ devpost-stats ../path/to.csv
      { ...someStats }
    
    $ devpost-stats ../path/to.csv -o ./path/to/output.json
      ✔ Statistics saved to file
```   

## License

MIT © [QHacks](https://github.com/qhacks)