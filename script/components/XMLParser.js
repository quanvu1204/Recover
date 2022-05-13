const convert = require("xml-js");

class XMLParser {
  constructor(xml) {
    this.xml = xml;
  }

  async parseXML(remoteXML = "") {
    let parsed;

    try {
      const xml = remoteXML;
      const json = convert.xml2json(xml, { compact: true, spaces: 4 });

      parsed = JSON.parse(json);
    } catch (error) {
      parsed = "error";
    }

    return parsed;
  }
}

module.exports = XMLParser;
