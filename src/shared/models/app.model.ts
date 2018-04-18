export class App{
    uid: string;
    title: String;
    short_description: String;
    full_description: String;

    type: String; //app,game
    category: String;

    iconURL: any;
    thumbIconURL: any;
    iconFileSize: number;
    
    screenshots: Array<any>; //[index]['high'] & [index]['low']

    website: String;
    email: String;

    // DISTRIBUTIONS
    platforms: AppPlatform;
    openSource: OpenSource;

    dateCreated: number;
    dateUpdated: number;
    status: String;

    constructor(){
        this.platforms = {
            web: {
                isCompatible: null,
                demoURL: null, //external url
            },
            android: {
                isCompatible: null,
                releases: [],
                demoURL: null, //external url
                // demoDownloadURL: null,
                // demoFilename: null,
                // demoFileSize: null,
                // dateUpdated: null,
            },
            desktop: {
                isCompatible: null,
                demoURL: null, //external url
                demoDownloadURL: null,
                demoFilename: null,
                demoFileSize: null,
                dateCreated: null,
            }
        }

        this.openSource = {
            // isOpenSource: null,
            sourceCodeURL: null, //external url
            sourceCodeDownloadURL: null,
            sourceCodeFilename: null,
            sourceCodeFilesize: null,
            dateCreated: null
        }
       
    }
}

interface AppPlatform {
    web: {
        isCompatible: boolean,
        demoURL: string,
    }
    android: {
        // versions: Array<any>
        isCompatible: boolean,
        releases: Array<any>,
        demoURL: string,
        // demoDownloadURL: string,
        // demoFilename: string,
        // demoFileSize: number,
        // dateUpdated: number,
    }
    desktop: {
        isCompatible: boolean,
        demoURL: string,
        demoDownloadURL: string,
        demoFilename: string,
        demoFileSize: number,
        dateCreated: number,
    }
}

interface AppRelease{
    dateCreated: number,
    demoURL: string,
    demoDownloadURL: string,
    demoFilename: string,
    demoFileSize: number,

    packageName: string,
    usesPermissions: Array<any>,
    usesSdk: {
        minSdkVersion: number,
        maxSdkVersion: number
    },
    versionCode: number,
    versionName: string

    // initial: {
    //     dateUpdated: number,
    //     demoURL: string,
    //     demoDownloadURL: string,
    //     demoFilename: string,
    //     demoFileSize: number,

    //     packageName: string,
    //     usesPermissions: Array<any>,
    //     usesSdk: {
    //         minSdkVersion: number,
    //         targetSdkVersion: number
    //     },
    //     versionCode: number,
    //     versionName: string,
    // }
    // Other properties are the push uid's of firebase
}

interface OpenSource{
    // isOpenSource: boolean;
    sourceCodeURL: string;
    sourceCodeDownloadURL: string;
    sourceCodeFilename: string;
    sourceCodeFilesize: string;
    dateCreated: number;
}