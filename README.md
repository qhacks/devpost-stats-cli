# Devpost Stats CLI

> Get stats about your hackathon from the comfort of your terminal :rocket:

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

MIT © QHacks