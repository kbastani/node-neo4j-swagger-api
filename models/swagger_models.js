module.exports = {
  "Envelope":{
    "id":"Envelope",
    "properties":{
      "response":[
        "Person",
        "Movie",
        "List[Person]",
        "List[Movie]",
      ],
      "responseTime":"integer",
      "name":{
        "type":"string"
      }
    }
  },
  "Count":{
    "id":"Count",
    "properties": {
      "count":{
        "type":"integer"
      }
    }
  },
  "Movie":{
    "id":"Movie",
    "properties":{
      // "tags":{
      //   "items":{
      //     "$ref":"Tag"
      //   },
      //   "type":"Array"
      // },
      "id":{
        "type":"string"
      },
      // "category":{
      //   "items": {
      //     "$ref":"Category"
      //   }
      // },
      // "status":{
      //   "allowableValues":{
      //     "valueType":"LIST",
      //     "values":[
      //       "available",
      //       "pending",
      //       "sold"
      //     ],
      //     "valueType":"LIST"
      //   },
      //   "description":"movie status in the store",
      //   "type":"string"
      // },
      "name":{
        "type":"string"
      }
      // "photoUrls":{
      //   "items":{
      //     "type":"string"
      //   },
      //   "type":"Array"
      // }
    }
  },
  "Person":{
    "id":"Person",
    // "required": ["id"],
    "properties":{
      "id":{
        "type":"string"
      },
      "name":{
        "type":"string"
      },
      "created":{
        "type":"number"
      }
    }
  },
  "newPerson":{
    "id":"newPerson",
    "required": ["name"],
    "properties":{
      "name":{
        "type":"string",
      }
    }
  }
};