const express = require('express');const app = express();
const axios = require('axios');
const { MongoClient } = require('mongodb');
const client = new MongoClient('mongodb://127.0.0.1:27017');

app.use(express.json());
app.use(auth_middleware);


var db,accounts_clct,panels_clct,logs_clct,users_clct;

(async function connect_to_db()
{
    await client.connect();
    db = client.db('KN_PANEL');
    accounts_clct = db.collection('accounts');
    panels_clct = db.collection('panels');
    users_clct = db.collection('users');
    logs_clct = db.collection('logs');
})();

// --- UTILS --- //

const uid = () => { return Math.floor(Math.random() * (999999999 - 100000000 + 1)) + 100000000; }

const uidv2 = () => 
{
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < 30) 
    {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
}

const insert_to_accounts = async (obj) => { await accounts_clct.insertOne(obj);return "DONE"; }
const get_accounts = async () => {const result = await accounts_clct.find().toArray();return result;}
const get_account = async (id) => {const result = await accounts_clct.find({id}).toArray();return result[0];}
const update_account = async (id,value) => {await accounts_clct.updateOne({id},{$set:value},function(){});return "DONE";}

const insert_to_panels = async (obj) => { await panels_clct.insertOne(obj);return "DONE"; }
const get_panels = async () => {const result = await panels_clct.find().toArray();return result;}
const get_panel = async (id) => {const result = await panels_clct.find({id}).toArray();return result[0];}
const update_panel = async (id,value) => {await panels_clct.updateOne({id},{$set:value},function(){});return "DONE";}

const insert_to_users = async (obj) => { await users_clct.insertOne(obj);return "DONE"; }
const get_users = async (agent_id) => {const result = await users_clct.find({agent_id}).toArray();return result;}
const get_all_users = async () => {const result = await users_clct.find({}).toArray();return result;}
const get_user1 = async (id) => {const result = await users_clct.find({id}).toArray();return result[0];}
const get_user2 = async (username) => {const result = await users_clct.find({username}).toArray();return result[0];}
const update_user = async(id,value) => {await users_clct.updateOne({id},{$set:value},function(){});return "DONE";}

const insert_to_logs = async (account_id,action,msg) => 
{
    var username = (await get_account(account_id)).username;
    var obj = { 
                id:uid(),
                account_id,
                action,
                msg:username + " " + msg,
                time:Math.floor(Date.now()/1000)
              }

    await logs_clct.insertOne(obj);
    return "DONE"; 
}

const get_logs = async () => {const result = await logs_clct.find().toArray();return result;}


const b2gb = (bytes) => 
{
    return (bytes / (2 ** 10) ** 3).toFixed(2);
}

const gb2b = (g) => 
{
    return (g * (2 ** 10) ** 3);
}

const dnf = (x) => // Desired Number Format
{
    return Math.round(x*100)/100;
}

const add_token = async (id) => 
{
    var expire = Math.floor(Date.now()/1000) + 3600;
    var token = uidv2();
    var obj = { token , expire };
    await accounts_clct.updateOne({id},{$push:{tokens:obj}},function(){});return token;
}

const token_to_account = async (token) => 
{
    var accounts = await get_accounts();
    var account = accounts.filter(x => x.tokens.filter(y => y.token == token)[0])[0];
    return account;
}

// --- MARZBAN UTILS --- //

const auth_marzban = async (link,username,password) =>
{
    try
    {
        var auth_res = 
        {
            'accept': 'application/json',
            'Authorization':'',
            'Content-Type': 'application/json'
        };

        const headers =
        {
            'accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        };

        var resp = await axios.post(link+"/api/admin/token",{username,password},{headers});
        auth_res['Authorization'] = resp.data['token_type'] + ' ' + resp.data['access_token'];
        return auth_res;
    }

    catch(err)
    {
        return "ERR";
    }
}

const get_panel_info = async (link,username,password) =>
{
    try
    {
        var headers = await auth_marzban(link,username,password);
        if(headers == "ERR") return "ERR";
        var panel_info = (await axios.get(link+"/api/system",{headers})).data;
        var panel_inbounds = (await axios.get(link+"/api/inbounds",{headers})).data;
    
        var info_obj =
        {
            total_users:panel_info['total_user'],
            active_users:panel_info['users_active'],
            data_usage:b2gb(panel_info['incoming_bandwidth'] + panel_info['outgoing_bandwidth']),
            panel_inbounds     
        };
    
        return info_obj;
    }

    catch(err)
    {
        return "ERR"
    }
}

const make_vpn = async (link,username,password,vpn_name,data_limit,expire) =>
{
    try
    {
        var headers = await auth_marzban(link,username,password);
        if(headers == "ERR") return "ERR";
        var {panel_inbounds} = await get_panel_info(link,username,password);
        var proxy_obj = {};

        for(inbound in panel_inbounds) proxy_obj[inbound] = {}; 

        var req_obj = 
        {
            "username":vpn_name,
            "proxies":proxy_obj,
            "inbounds":{},
            "expire":expire,
            "data_limit":data_limit,
            "data_limit_reset_strategy":"no_reset"
        };

        var res = await axios.post(link+"/api/user",req_obj,{headers});
        return res.data;
    }

    catch(err)
    {
        return "ERR";
    }
}

const delete_vpn = async (link,username,password,vpn_name) =>
{
    try
    {
        var headers = await auth_marzban(link,username,password);
        if(headers == "ERR") return "ERR";
        var res = await axios.delete(link+"/api/user/"+vpn_name,{headers});
        return "DONE";
    }

    catch(err)
    {
        return "ERR";
    }
}

const disable_vpn = async(link,username,password,vpn_name) =>
{
    try
    {
        var headers = await auth_marzban(link,username,password);
        if(headers == "ERR") return "ERR";
        var res = await axios.put(link+"/api/user/"+vpn_name,{status:"disabled"},{headers});
        return "DONE";
    }

    catch(err)
    {
        return "ERR";
    }
}

const enable_vpn = async(link,username,password,vpn_name) =>
{
    try
    {
        var headers = await auth_marzban(link,username,password);
        if(headers == "ERR") return "ERR";
        var res = await axios.put(link+"/api/user/"+vpn_name,{status:"active"},{headers});
        return "DONE";
    }

    catch(err)
    {
        return "ERR";
    }
}

const edit_vpn = async(link,username,password,vpn_name,data_limit,expire) =>
{
    try
    {
        console.log(link,username,password,vpn_name,data_limit,expire);
        var headers = await auth_marzban(link,username,password);
        if(headers == "ERR") return "ERR";
        console.log(headers);
        var res = await axios.put(link+"/api/user/"+vpn_name,{data_limit,expire},{headers});
        console.log(res);
        return "DONE";
    }

    catch(err)
    {
        return "ERR";
    }
}


// --- MIDDLEWARE --- //

async function auth_middleware(req, res, next)
{

    // var accounts = await get_accounts();
    // accounts.forEach(async (account) => 
    // {
    //     var tokens = account.tokens;
    //     var new_tokens = tokens.filter(x => x.expire > Math.floor(Date.now()/1000));
    //     await update_account(account.id,{tokens:new_tokens});
    // });

    if(req.url == "/login") return next();
    var {access_token} = req.body;
    var account = await token_to_account(access_token);
    if(!account) return res.send({status:"ERR",msg:'Token is either expired or invalid'});
    else return next();
}

// --- ENDPOINTS --- //

app.post("/get_agents", async (req, res) => 
{
    var obj_arr = await accounts_clct.find({is_admin:0}).toArray();
    res.send(obj_arr);
});

app.post("/get_panels", async (req, res) => 
{
    var obj_arr = await panels_clct.find({}).toArray();

    for(obj of obj_arr)
    {
        var {panel_url,panel_username,panel_password} = obj;
        var info_obj = await get_panel_info(panel_url,panel_username,panel_password);
        if(info_obj == "ERR") continue;
        else await update_panel(obj.id,info_obj);
    }

    res.send(obj_arr);
});

app.post("/get_users", async (req, res) => 
{
    var { access_token } = req.body;
    var agent_id = (await token_to_account(access_token)).id
    var obj = await get_users(agent_id);
    res.send(obj);
});

app.post("/get_agent", async (req, res) => 
{
    var { access_token } = req.body;
    var agent = await token_to_account(access_token);
    res.send(agent);
});

app.post("/get_agent_logs", async (req, res) => 
{
    const { access_token } = req.body;
    var obj = await get_logs();
    var account_id = (await token_to_account(access_token)).id;
    obj.sort((a,b) => b.time - a.time);
    obj = obj.filter(x => x.account_id == account_id);
    obj = obj.slice(0,Math.min(obj.length,10));
    res.send(obj);
});

app.post("/get_admin_logs", async (req, res) => 
{
    var obj = await get_logs();
    obj.sort((a,b) => b.time - a.time);
    obj = obj.slice(0,Math.min(obj.length,10));
    res.send(obj);
});

app.post("/login", async (req, res) => 
{

    const {username,password} = req.body;
    const accounts = await get_accounts();
    const account = accounts.filter(x => x.username == username && x.password == password)[0];

    if(account)
    {
        var access_token = await add_token(account.id);
        await insert_to_logs(account.id,"LOGIN","logged in");
        res.send({is_admin:account.is_admin,access_token});
    }

    else
    {
        res.status(401).send({message: 'NOT FOUND'});
    }

});

app.post("/create_agent", async (req, res) => 
{
    

    const { name,
            username,
            password,
            volume,
            min_vol,
            max_users,
            max_days,
            prefix,
            country,
            access_token } = req.body;



    if(!name || !username || !password || !volume || !min_vol || !max_users || !max_days || !prefix || !country) res.send({status:"ERR",msg:"fill all of the inputs"})
    
    else 
    {
        await insert_to_accounts({  id:uid(),
                                    is_admin:0,
                                    disable:0,
                                    name,
                                    username,
                                    password,
                                    volume:dnf(volume),
                                    allocatable_data:dnf(volume),
                                    min_vol:dnf(min_vol),
                                    max_users:parseInt(max_users),
                                    max_days:parseInt(max_days),
                                    prefix,
                                    country,
                                    used_traffic:0.00,
                                    active_users:0,
                                    total_users:0,
                                    tokens:[] 
                                });

        res.send("DONE");
    }

});

app.post("/create_panel", async (req, res) => 
{
    const { panel_name,
            panel_url,
            panel_username,
            panel_password,
            panel_country,
            panel_user_max_count,
            panel_traffic,
            access_token } = req.body;


    var panel_info = await get_panel_info(panel_url,panel_username,panel_password);



    if(!panel_name || !panel_url || !panel_username || !panel_password || !panel_country || !panel_user_max_count || !panel_traffic ) res.send({status:"ERR",msg:"fill all of the inputs"})
    else if(panel_info == "ERR") res.send({status:"ERR",msg:"Failed to connect to panel"});
    
    else 
    {
        await insert_to_panels({    id:uid(),
                                    disable:0,
                                    panel_name,
                                    panel_username,
                                    panel_password,
                                    panel_url,
                                    panel_country,
                                    panel_user_max_count:parseInt(panel_user_max_count),
                                    panel_traffic:dnf(panel_traffic),
                                    panel_data_usage:dnf(panel_info.data_usage),
                                    active_users:panel_info.active_users,
                                    total_users:panel_info.total_users,
                                });

        res.send("DONE");
    }
});

app.post("/create_user", async (req, res) => 
{
    const { username,
            expire, 
            data_limit,
            country,
            access_token } = req.body;

    if( !username || !expire || !data_limit || !country ) res.send({status:"ERR",msg:"fill all of the inputs"})

     var corresponding_agent = await token_to_account(access_token); 
     var agent_id = corresponding_agent.id;
     var all_usernames = [...(await get_all_users()).map( x => x.username )];
     var panels_arr = await get_panels();
     var selected_panel = panels_arr.filter(x => /*x.panel_country == country &&*/ (x.total_users < x.panel_user_max_count) && (x.disable == 0))[0];
     
    if(corresponding_agent.disable) res.send({status:"ERR",msg:"your account is disabled"})   
    else if(data_limit > corresponding_agent.allocatable_data) res.send({status:"ERR",msg:"not enough allocatable data"})
    else if(expire > corresponding_agent.max_days) res.send({status:"ERR",msg:"maximum allowed days is " + corresponding_agent.max_days})
    else if(corresponding_agent.min_vol > data_limit) res.send({status:"ERR",msg:"minimum allowed data is " + corresponding_agent.min_vol})
    else if(all_usernames.includes(username)) res.send({status:"ERR",msg:"username already exists"})
    else if(!selected_panel) res.send({status:"ERR",msg:"no available server"});
    else 
    {

        var mv = await make_vpn(selected_panel.panel_url,
                                selected_panel.panel_username,
                                selected_panel.panel_password,
                                corresponding_agent.prefix + "_" + username,
                                gb2b(data_limit),
                                Math.floor(Date.now()/1000) + expire*24*60*60)

        if(mv == "ERR") res.send({status:"ERR",msg:"failed to connect to marzban"})

        else
        {
            await insert_to_users({     id:uid(),
                                        agent_id,
                                        status:"active",
                                        disable:0,
                                        username:corresponding_agent.prefix + "_" + username,
                                        expire: Math.floor(Date.now()/1000) + expire*24*60*60,  
                                        data_limit: gb2b(data_limit),
                                        used_traffic:0.00,
                                        country,
                                        corresponding_panel_id:selected_panel.id,
                                        corresponding_panel:selected_panel.panel_url,
                                        subscription_url:selected_panel.panel_url+mv.subscription_url,
                                        links:mv.links
                                   });

             res.send("DONE");
        }



        
    }



});

app.post("/delete_agent", async (req, res) => 
{
    var { access_token, agent_id } = req.body;
    await accounts_clct.deleteOne({id:agent_id});
    res.send("DONE");
});

app.post("/delete_panel", async (req, res) => 
{
    var { access_token, panel_id } = req.body;
    await panels_clct.deleteOne({id:panel_id});
    res.send("DONE");
});

app.post("/delete_user", async (req, res) => 
{
    var { access_token, username } = req.body;
    var user_obj = await get_user2(username);
    var panel_obj = await get_panel(user_obj.corresponding_panel_id);
    var result = await delete_vpn(panel_obj.panel_url,panel_obj.panel_username,panel_obj.panel_password,username);
    if(result == "ERR") res.send({status:"ERR",msg:"failed to connect to marzban"})
    else
    {
        await users_clct.deleteOne({username});
        res.send("DONE");
    }

});

app.post("/disable_panel", async (req, res) => 
{
    var { access_token, panel_id } = req.body;
    await update_panel(panel_id,{disable:1});
    res.send("DONE");
});

app.post("/disable_agent", async (req, res) => 
{
    var { access_token, agent_id } = req.body;
    await update_account(agent_id,{disable:1});
    res.send("DONE");

});

app.post("/disable_user", async (req, res) => 
{
    var { access_token, user_id } = req.body;
    var user_obj = await get_user1(user_id);
    var panel_obj = await get_panel(user_obj.corresponding_panel_id);
    var result = await disable_vpn(panel_obj.panel_url,panel_obj.panel_username,panel_obj.panel_password,user_obj.username);
    if(result == "ERR") res.send({status:"ERR",msg:"failed to connect to marzban"});
    else
    {
        await update_user(user_id,{status:"disable",disable:1});
        res.send("DONE");
    }
});

app.post("/enable_agent", async (req, res) => 
{
    var { access_token, agent_id } = req.body;
    await update_account(agent_id,{disable:0});
    res.send("DONE");
});

app.post("/enable_panel", async (req, res) => 
{
    var { access_token, panel_id } = req.body;
    await update_panel(panel_id,{disable:0});
    res.send("DONE");
});

app.post("/enable_user", async (req, res) => 
{
    var { access_token, user_id } = req.body;
    var user_obj = await get_user1(user_id);
    var panel_obj = await get_panel(user_obj.corresponding_panel_id);
    var result = await enable_vpn(panel_obj.panel_url,panel_obj.panel_username,panel_obj.panel_password,user_obj.username);
    if(result == "ERR") res.send({status:"ERR",msg:"failed to connect to marzban"});
    else
    {
        await update_user(user_id,{status:"active",disable:0});
        res.send("DONE");
    }
});

app.post("/edit_agent", async (req, res) => 
{
    const { agent_id,
            name,
            username,
            password,
            volume,
            min_vol,
            max_users,
            max_days,
            prefix,
            country,
            access_token } = req.body;


    if(!name || !username || !password || !volume || !min_vol || !max_users || !max_days || !prefix || !country) res.send({status:"ERR",msg:"fill all of the inputs"})
    
    else 
    {
        var agent = await get_account(agent_id);
        var old_volume = agent.volume;
        var old_alloc = agent.allocatable_data;

        await update_account(agent_id,{ name,
                                        username,
                                        password,
                                        volume:dnf(volume),
                                        allocatable_data:dnf(old_alloc) + dnf(volume) - dnf(old_volume),       
                                        min_vol:dnf(volume),
                                        max_users:parseInt(max_users),
                                        max_days:parseInt(max_days),
                                        prefix,
                                        country
                                      });
        res.send("DONE");
    }


});

app.post("/edit_panel", async (req, res) => 
{
    const { panel_id,
            panel_name,
            panel_username,
            panel_url,
            panel_password,
            panel_user_max_count,
            panel_traffic,
            access_token } = req.body;



    var panel_info = await get_panel_info(panel_url,panel_username,panel_password);


    if(!panel_name || !panel_username || !panel_password || !panel_user_max_count || !panel_traffic ) res.send({status:"ERR",msg:"fill all of the inputs"})
    else if(panel_info == "ERR") res.send({status:"ERR",msg:"Failed to connect to panel"});

    else
    { 
        await update_panel(panel_id,{panel_name,
                                     panel_username,
                                     panel_password,
                                     panel_user_max_count:parseInt(panel_user_max_count),
                                     panel_traffic:dnf(panel_traffic),
                                    });
        res.send("DONE");
    }

});

app.post("/edit_user", async (req, res) => 
{
        const { user_id,
                expire, 
                data_limit,
                country,
                access_token } = req.body;

    if( !user_id || !expire || !data_limit || !country ) res.send({status:"ERR",msg:"fill all of the inputs"})

    var user_obj = await get_user1(user_id);
    var panel_obj = await get_panel(user_obj.corresponding_panel_id);
    var corresponding_agent = await token_to_account(access_token); 

    if(corresponding_agent.disable) res.send({status:"ERR",msg:"your account is disabled"})   
    else if(data_limit > corresponding_agent.allocatable_data) res.send({status:"ERR",msg:"not enough allocatable data"})
    else if(expire > corresponding_agent.max_days) res.send({status:"ERR",msg:"maximum allowed days is " + corresponding_agent.max_days})
    else if(corresponding_agent.min_vol > data_limit) res.send({status:"ERR",msg:"minimum allowed data is " + corresponding_agent.min_vol})
    else 
    {
        var result = await edit_vpn(panel_obj.panel_url,panel_obj.panel_username,panel_obj.panel_password,user_obj.username,data_limit*((2**10)**3),Math.floor(Date.now()/1000) + expire*24*60*60);
        
        if(result == "ERR") res.send({status:"ERR",msg:"failed to connect to marzban"});

        else
        {
            await update_user(user_id,{    
                                            expire: Math.floor(Date.now()/1000) + expire*24*60*60,  
                                            data_limit: data_limit*((2**10)**3),
                                       });

            res.send("DONE");
        }
        

    }


});

app.post("/edit_self", async (req, res) => 
{
        const { username,password,access_token } = req.body;
        var account_id = (await token_to_account(access_token)).id;
        await update_account(account_id,{username,password});
        res.send("DONE");
});



app.listen(5000, () => {
    console.log("--------------");
    console.log("SERVER STARTED !");
    console.log("--------------");
});




