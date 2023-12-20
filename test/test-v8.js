const { chromium } = require('playwright');
const EC = require('eight-colors');
const CG = require('console-grid');

const CoverageReport = require('../');

// v8 and lcov
const coverageOptions = {
    // logging: 'debug',
    // watermarks: [60, 90],
    reports: 'v8',

    name: 'My V8 Coverage Report',
    assetsPath: '../assets',
    lcov: true,

    sourceFilter: (sourcePath) => sourcePath.search(/src\//) !== -1 || sourcePath.search(/minify\//) !== -1,

    outputDir: './docs/v8'
};

// v8 and istanbul reports
const multipleReportsOptions = {
    // logging: 'debug',

    // https://github.com/istanbuljs/istanbuljs/tree/master/packages/istanbul-reports/lib
    reports: [
        ['v8'],
        ['v8-json', {
            // outputFile: 'json/v8-report.json'
        }],
        ['html', {
            subdir: 'istanbul'
        }],
        ['json', {
            file: 'my-json-file.json'
        }],
        'lcovonly'
    ],

    name: 'My V8 sub dir Coverage Report',
    // v8 sub dir
    outputFile: 'v8/index.html',
    assetsPath: '../../assets',

    // reportPath: 'lcov.info',
    reportPath: () => {
        return 'my-json-file.json';
    },

    onEnd: (coverageResults) => {
        const summary = coverageResults.summary;
        console.log(summary);
        CG({
            columns: [{
                id: 'name'
            }, {
                id: 'value',
                formatter: (v, row, column) => {
                    if (row.name === 'pct') {
                        // in red color if coverage less than 90%
                        if (v < 90) {
                            v = EC.red(v);
                        }
                        return v;
                    }
                    return v;
                }
            }],
            rows: Object.keys(summary).map((id) => {
                const indicator = summary[id];
                return {
                    name: id,
                    value: '',
                    subs: Object.keys(indicator).map((k) => {
                        return {
                            name: k,
                            value: indicator[k]
                        };
                    })
                };
            })
        });
    },

    outputDir: './docs/v8-and-istanbul'
};

const test1 = async (serverUrl) => {

    console.log('start v8 test1 ...');
    const browser = await chromium.launch({
        //  headless: false
    });
    const page = await browser.newPage();

    await Promise.all([
        page.coverage.startJSCoverage({
            resetOnNavigation: false
        }),
        page.coverage.startCSSCoverage({
            resetOnNavigation: false
        })
    ]);

    const url = `${serverUrl}/v8/`;

    console.log(`goto ${url}`);

    await page.goto(url);

    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });

    await page.evaluate(() => {
        const { foo } = window['coverage-v8'];
        foo();
    });

    await page.evaluate(() => {
        const { bar } = window['coverage-v8'];
        bar();
    });

    const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage()
    ]);

    const coverageList = [... jsCoverage, ... cssCoverage];

    // v8
    const report = await new CoverageReport(coverageOptions).add(coverageList);

    // to istanbul
    await new CoverageReport(multipleReportsOptions).add(coverageList);

    console.log('v8 coverage1 added', report.type);

    await browser.close();
};


const test2 = async (serverUrl) => {

    console.log('start v8 test2 ...');
    const browser = await chromium.launch({
        // headless: false
    });
    const page = await browser.newPage();

    await Promise.all([
        page.coverage.startJSCoverage({
            resetOnNavigation: false
        }),
        page.coverage.startCSSCoverage({
            resetOnNavigation: false
        })
    ]);

    const url = `${serverUrl}/v8/`;

    console.log(`goto ${url}`);

    await page.goto(url);

    await new Promise((resolve) => {
        setTimeout(resolve, 500);
    });

    await page.evaluate(() => {
        const { start } = window['coverage-v8'];
        start();
    });

    const [jsCoverage, cssCoverage] = await Promise.all([
        page.coverage.stopJSCoverage(),
        page.coverage.stopCSSCoverage()
    ]);

    const coverageList = [... jsCoverage, ... cssCoverage];

    const report = await new CoverageReport(coverageOptions).add(coverageList);

    // to istanbul
    await new CoverageReport(multipleReportsOptions).add(coverageList);

    console.log('v8 coverage2 added', report.type);

    await browser.close();
};


const generate = async () => {

    console.log('generate v8 coverage reports ...');

    const coverageResults1 = await new CoverageReport(coverageOptions).generate();
    console.log('reportPath', EC.magenta(coverageResults1.reportPath));
    console.log('v8 coverage generated', Object.keys(coverageResults1), coverageResults1.summary);

    // to istanbul
    const coverageResults2 = await new CoverageReport(multipleReportsOptions).generate();
    console.log('reportPath', EC.magenta(coverageResults2.reportPath));
};


module.exports = async (serverUrl) => {
    // clean cache first if debug
    if (coverageOptions.logging === 'debug') {
        const coverageReport = new CoverageReport(coverageOptions);
        await coverageReport.cleanCache();
    }

    await Promise.all([
        test1(serverUrl),
        test2(serverUrl)
    ]);

    await generate();
};