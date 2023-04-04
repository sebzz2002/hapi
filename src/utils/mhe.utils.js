const {Client} = require("pg")
function get_str_converted(res) {
  console.log("I am called");
  let str = "(";
  let arr = [];
  for (let key in res.rows) {
    arr.push(res.rows[key]["key_id"]);
  }
  console.log("**********************" + arr + "***********");
  str += arr.join();
  str += ")";
  return str;
}

async function get_things_data(id, startTs, endTs, key, val, client) {
  let keyIdForKey = `Select key_id from ts_kv_dictionary where key='${key}'`;
  const res = await client.query(keyIdForKey);
  let key_id = res.rows[0]["key_id"];
  console.log("key",key_id)
  console.log(id)
  let getDataQuery = `Select ${val} as ${key} from ts_kv where entity_id='${id}' and key =${key_id} and ts>=${startTs} and ts<=${endTs}`;
  console.log(getDataQuery)
  let res2 = await client.query(getDataQuery);
  return res2.rows;
}

function get_res(res1, res2) {
  let final = res1.map((item, i) => Object.assign({}, item, res2[i]));
  return final;
}

function sortarr(arr) {
  let val = arr.sort(function (x, y) {
    return x.ts - y.ts;
  });
  return val;
}

function get_count(arr, val, key) {
  let count = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] == val) {
      count++;
    }
  }
  return count;
}

function get_count_obj(arr, key) {
  let count_obj = {};
  if (key == "state") {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][key] == "machine is on") {
        if (count_obj.hasOwnProperty(arr[i]["ename"])) {
          count_obj[arr[i]["ename"]] = count_obj[arr[i]["ename"]] + 1;
        } else {
          count_obj[arr[i]["ename"]] = 1;
        }
      }
    }
  }
  if (key == "voilation") {
    for (let i = 0; i < arr.length; i++) {
      let voil = arr[i]["voilation"];
      let enm = arr[i]["ename"];
      if (count_obj.hasOwnProperty(arr[i]["ename"])) {
        count_obj[enm][voil] = count_obj[enm][voil] + 1;
      } else {
        let temp = new Object();
        temp["ACS_A"] = 0;
        temp["ACS_E"] = 0;
        temp["CAS_A"] = 0;
        temp["CAS_E"] = 0;
        temp["shock"] = 0;
        temp["crash"] = 0;
        temp["os"] = 0;
        temp[voil] = 1;
        count_obj[enm] = temp;
      }
    }
  }
  return count_obj;
}

async function get_postgres_client(query) {
  const client = new Client({
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    user: process.env.DBUSR,
    password: process.env.DBPASSWORD,
    database: process.env.DATABASE,
  });
  await client.connect((err) => {
    if (err) {
      console.error("connection error", err.stack);
    } else {
      console.log("connected");
    }
  });
  console.log(query);
  let res = await client.query(query);
  await client.end();
  return res;
}

module.exports ={
	get_str_converted,
	get_things_data,
	get_res,
	sortarr,
	get_count,
	get_count_obj,
	get_postgres_client
}
