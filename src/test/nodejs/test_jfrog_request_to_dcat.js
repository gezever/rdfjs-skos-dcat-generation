
import request from 'request';


let url = 'https://repo.omgeving.vlaanderen.be/artifactory/api/search/gavc?g=be.vlaanderen.omgeving.data.id.graph&a=codelijst-emissie&classifier=sources&repos=release'

let options = {json: true};

request(url, options, (error, res, body) => {
    if (error) {
        return  console.log(error)
    };

    if (!error && res.statusCode == 200) {
        console.log(body)
    };
});


let url2 = 'https://repo.omgeving.vlaanderen.be/artifactory/api/search/versions?g=be.vlaanderen.omgeving.data.id.graph&a=codelijst-emissie&classifier=sources&repos=release'

let options2 = {json: true};

request(url2, options2, (error, res, body) => {
    if (error) {
        return  console.log(error)
    };

    if (!error && res.statusCode == 200) {
        console.log(body)
    };
});
