const path = require("path");
const {Client} = require("pg");
const {
	get_postgres_client,
	get_str_converted,
	sortarr,
	get_count,
	get_count_obj,
	get_res
} = require("../../utils/mhe.utils");


const getSafProd = async (req, res) => {
  let startTs, endTs, type, customer_id;
  if (req.query.startTs) {
    startTs = req.query.startTs;
  } else {
    res.send({
      msg: "Start time  not provided",
      status: 400,
    });
  }
  if (req.query.endTs) {
    endTs = req.query.endTs;
  } else {
    res.send({
      msg: "End time  not provided",
      status: 400,
    });
  }
  if (req.query.customer_id) {
    customer_id = req.query.customer_id.split(",");
  } else {
    res.send({
      msg: "Customer id not provided",
      status: 400,
    });
  }
  if (req.query.type) {
    type = req.query.type;
  } else {
    res.send({
      msg: "Device type not provided",
      status: 400,
    });
  }
  let obj_dev = new Object();
  for (let customer in customer_id) {
    let qry = `Select * from device where customer_id='${customer_id[customer]}' and type='MHE'`;
    let res = await get_postgres_client(qry);
    for (let idx in res.rows) {
      obj_dev[res.rows[idx]["id"]] = new Object();
      let obj = obj_dev[res.rows[idx]["id"]];
      obj["Device"] = res.rows[idx]["name"];
    }
  }
  //console.log(obj_dev)
  let final_obj = new Object();
  let queryForMachStateAndRunKey = `Select key_id from ts_kv_dictionary where key in ('machine_state','running')`;
  let queryForVoilationsKey = `Select key_id from ts_kv_dictionary where key in ('CAS_A','CAS_E','ACS_A','ACS_E','os','shock','crash')`;
  let queryForeNameKey = `Select key_id from ts_kv_dictionary where key='eName'`;
  let queryForMachStateRes = await get_postgres_client(
    queryForMachStateAndRunKey
  );
  let queryForVoilRes = await get_postgres_client(queryForVoilationsKey);
  let queryForeNameRes = await get_postgres_client(queryForeNameKey);
  let keyForMachSt = get_str_converted(queryForMachStateRes);
  let keyForVoil = get_str_converted(queryForVoilRes);
  let keyForeName = get_str_converted(queryForeNameRes);
  for (let key in obj_dev) {
    let dataQryForMacSt = `Select ts,str_v as state from ts_kv where entity_id='${key}' and key in ${keyForMachSt} and ts>=${startTs} and ts<=${endTs}`;
    let dataQryForVoil = `Select ts,str_v as voilation from ts_kv where entity_id='${key}' and key in ${keyForVoil} and ts>=${startTs} and ts<=${endTs}`;
    let dataQryForeName = `Select ts,str_v as eName from ts_kv where entity_id='${key}' and key in ${keyForeName} and ts>=${startTs} and ts<=${endTs}`;
    let macStData = await get_postgres_client(dataQryForMacSt);
    let voilData = await get_postgres_client(dataQryForVoil);
    let enameData = await get_postgres_client(dataQryForeName);
    //console.log(obj_dev[key]["Device"]+"**************************")
    let dr_hrs = macStData.rows.map((item, i) =>
      Object.assign({}, item, enameData.rows[i])
    );
    let total_voil = voilData.rows.map((item, i) =>
      Object.assign({}, item, enameData.rows[i])
    );
    let sorted_dr_hrs = sortarr(dr_hrs);
    let sorted_total_voil = sortarr(total_voil);
    if (type == "MHE") {
      let temp = new Object();
      temp["DrivingHr"] =
        get_count(sorted_dr_hrs, "machine is on", "state") * 20 * 1000;
      temp["CAS_A"] = get_count(sorted_total_voil, "CAS_A", "voilation");
      temp["CAS_E"] = get_count(sorted_total_voil, "CAS_E", "voilation");
      temp["ACS_A"] = get_count(sorted_total_voil, "ACS_A", "voilation");
      temp["ACS_E"] = get_count(sorted_total_voil, "ACS_E", "voilation");
      temp["Shock"] = get_count(sorted_total_voil, "shock", "voilation");
      temp["OverSpeed"] = get_count(sorted_total_voil, "os", "voilation");
      temp["Crash"] = get_count(sorted_total_voil, "crash", "voilation");
      final_obj[obj_dev[key]["Device"]] = temp;
    } else if (type == "operator") {
      let dr_hr = get_count_obj(sorted_dr_hrs, "state");
      let all_voil = get_count_obj(sorted_total_voil, "voilation");
      for (let itr in dr_hr) {
        if (final_obj.hasOwnProperty(itr)) {
          final_obj[itr]["DrivingHr"] =
            final_obj[itr]["DrivingHr"] + dr_hr[itr] * 20 * 1000;
        } else {
          let temp = new Object();
          temp["DrivingHr"] = dr_hr[itr] * 20 * 1000;
          final_obj[itr] = temp;
        }
      }
      for (let itr in all_voil) {
        let temp = all_voil[itr];
        if (final_obj.hasOwnProperty(itr)) {
          for (let vl in temp) {
            if (final_obj[itr].hasOwnProperty(vl)) {
              final_obj[itr][vl] = final_obj[itr][vl] + temp[vl];
            } else {
              final_obj[itr][vl] = temp[vl];
            }
          }
        } else {
          final_obj[itr] = temp;
        }
      }
    }
  }
  res.send(final_obj);
};

module.exports = {
	getSafProd
}
