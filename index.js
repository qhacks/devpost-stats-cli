#!/usr/bin/env node

const _ = require('lodash');
const fs = require('fs');
const meow = require('meow');
const mkdirp = require('mkdirp');
const ora = require('ora');
const parse = require('csv-parse');
const path = require('path');
const { promisify } = require('util');

/* Promisify callback function */
const parseAsync = promisify(parse);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

const spinner = ora();

const CLI_INPUT_VALIDATORS = [
    [
        [_.isString, '<csv> must be a string']
    ]
];
const DEVPOST_KEYS = {
    PRIZES: 'Desired Prizes',
    SCHOOLS: 'College/Universities Of Team Members',
    TECHNOLOGIES: 'Built With'
};
const MIXINS = [
    getUniversities,
    getTechnologies,
    getPrizes
];

main().catch(console.error);

async function main() {
    const cli = initializeCli();
    const csvPath = path.resolve(cli.input[0]);
    if (!fs.existsSync(csvPath)) {
        throw Error(`File "${csvPath}" does not exist`);
    }

    const stats = await createStats(csvPath);
    await outputStats(stats, cli.flags);
}

function initializeCli() {
    const cliOptions = {
        flags: {
            outputFile: {
                type: 'string',
                alias: 'o'
            }
        }
    };
    const cli = meow(`
	Usage
	  $ devpost-stats <csv>
	  
	Options
	  --output-file, -o  Specify a path and JSON file to save the statistics to

	Examples
	  $ devpost-stats ../path/to.csv
        { ...someStats }
	  
	  $ devpost-stats ../path/to.csv -o ./path/to/output.json
        ✔ Statistics saved to file
`, cliOptions);
    try {
        validateCli(cli, CLI_INPUT_VALIDATORS);
        return cli;
    } catch (e) {
        cli.showHelp()
    }
}

function validateCli(cli, inputValidators) {
    if (cli.input.length !== inputValidators.length) {
        throw Error('Invalid number of inputs supplied!');
    }

    const mappedInputValidator = inputValidators.map((validator, index) => [cli.input[index], validator]);
    mappedInputValidator.forEach(([input, validators]) => {
        executeValidatorsForInput(input, validators);
    });
}


function executeValidatorsForInput(input, validators) {
    validators.forEach(([validator, errorMessage]) => {
        if (!_.isFunction(validator)) {
            throw Error('Invalid validator. Only supply functions as validators!')
        }
        if (!validator(input)) {
            throw Error(errorMessage);
        }
    });
}


async function createStats(csvPath) {
    const submissions = await csvToJson(csvPath);
    const defaultStats = {
        count: submissions.length,
        submissions
    };
    return await (_.flow(
        () => defaultStats,
        ...MIXINS.map(mixin => mixin(submissions))
    ))();
}

async function csvToJson(csvPath) {
    const csv = (await readFileAsync(csvPath)).toString();
    const json = await parseCsvToJson(csv);
    const headers = _.head(json);
    const submissions = json.slice(1);
    return submissions.map(submission => _.zipObject(headers, submission))
}

async function parseCsvToJson(csv) {
    const options = { delimiter: ',', quote: '"', relax_column_count: true };
    return await parseAsync(csv, options);
}

function getFieldFromSubmissions(submissions, fieldKey) {
    return _(submissions)
        .map(
            ({ [fieldKey]: field }) =>
                _.isEmpty(field)
                    ? null
                    : field.split(', ').map(s => s.trim())
        )
        .compact()
        .flatten()
        .value();
}

function getCountFromArray(arr) {
    const INITIAL_COUNT = 1;
    return arr.reduce((counter, field) => {
        return Object.assign({}, counter, {
            [field]: isNaN(counter[field])
                ? INITIAL_COUNT
                : counter[field] + 1
        })
    }, {});
}

function getUniversities(submissions) {
    return (stats) => {
        spinner.start('Getting university count from submissions');
        const universitiesForSubmissions = getFieldFromSubmissions(submissions, DEVPOST_KEYS.SCHOOLS);
        const universities = getCountFromArray(universitiesForSubmissions);
        spinner.succeed('University count successful!');
        return Object.assign({}, stats, { universities });
    }
}

function getTechnologies(submissions) {
    return (stats) => {
        spinner.start('Getting technology count from submissions');
        const technologiesFromSubmissions = getFieldFromSubmissions(submissions, DEVPOST_KEYS.TECHNOLOGIES);
        const technologies = getCountFromArray(technologiesFromSubmissions);
        spinner.succeed('Technology count successful!');
        return Object.assign({}, stats, { technologies });
    }
}

function getPrizes(submissions) {
    return (stats) => {
        spinner.start('Getting submissions per prize');
        const prizesFromSubmissions = getFieldFromSubmissions(submissions, DEVPOST_KEYS.PRIZES);
        const prizes = getCountFromArray(prizesFromSubmissions);
        spinner.succeed('Submissions per prize calculated successfully!');
        return Object.assign({}, stats, { prizes });
    }
}

async function outputStats(stats, flags) {
    if (flags.outputFile) {
        const outputFile = path.resolve(flags.outputFile);
        try {
            spinner.start('Writing statistics to file');
            await saveStatsToFile(stats, outputFile);
            spinner.succeed('Statistics saved to file')
        } catch (error) {
            throw Error(JSON.stringify({
                message: 'Unable to save stats to file!',
                error
            }));
        }
    } else {
        console.log(stats);
    }
}

async function saveStatsToFile(stats, outputFile) {
    await writeFileAsync(outputFile, JSON.stringify(stats));
}
