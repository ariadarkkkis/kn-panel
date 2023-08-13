var accounts_clct, panels_clct, users_clct, logs_clct;

const {
    uid,
    sleep,
    get_account,
    update_account,
    get_panel,
    get_panels,
    update_panel,
    get_all_users,
    get_user2,
    update_user,
    b2gb,
    dnf,
    get_panel_info,
    get_all_marzban_users,
    ping_panel,
    connect_to_db,
    auth_marzban,
    insert_to_users,
    delete_vpn
} = require("./utils");


connect_to_db().then(res => {
    accounts_clct = res.accounts_clct;
    panels_clct = res.panels_clct;
    users_clct = res.users_clct;
    logs_clct = res.logs_clct;
});


(async () => {
    await sleep(5000);

    while (true) {
        var panels_arr = await get_panels();
        var db_users_arr = await get_all_users();
        for (panel of panels_arr) {
            if (panel.disable)
            {
                var panel_auth_res = await auth_marzban(panel.panel_url, panel.panel_username, panel.panel_password);
                if(panel_auth_res == "ERR")
                {
                    continue;
                }

                else
                {
                    await update_panel(panel.id, {disable: 0});
                    console.log("panel " + panel.panel_url + " is now enabled");
                }
            }
            var today = new Date();
            var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
            console.log(time + " ---> fetching " + panel.panel_url);

            var info_obj = await get_panel_info(panel.panel_url, panel.panel_username, panel.panel_password);
            if (info_obj == "ERR") {
                console.log(time + " ===> failed to fetch ( INFO ) " + panel.panel_url);
                await ping_panel(panel);
                continue;
            }
            else await update_panel(panel.id, info_obj);

            var marzban_users = await get_all_marzban_users(panel.panel_url, panel.panel_username, panel.panel_password);
            if (marzban_users == "ERR") {
                console.log(time + " ===> failed to fetch ( USERS ) " + panel.panel_url);
                continue;
            }

            marzban_users = marzban_users.users;

            for (db_user of db_users_arr) {

                var cors_panel = await get_panel(db_user.corresponding_panel_id);
                var cors_agent = await get_account(db_user.agent_id);
        
                if(!cors_panel)
                {
                    console.log("panel not found for user " + db_user.username + " deleting...");
                    await users_clct.deleteOne({username: db_user.username});
                }
        
                if(!cors_agent)
                {
                    console.log("agent not found for user " + db_user.username + " deleting...");
                    await users_clct.deleteOne({username: db_user.username});
                }


                var user = marzban_users.find(user => user.username == db_user.username);
                if (!user && db_user.corresponding_panel == panel.panel_url) {
                    console.log("user " + db_user.username + " not found in " + panel.panel_url + " deleting...");
                    var user_obj = await get_user2(db_user.username);
                    var agent_obj = await get_account(user_obj.agent_id);
                    if( !(agent_obj.business_mode == 1 && (user_obj.used_traffic > user_obj.data_limit/4 || (user_obj.expire - user_obj.created_at) < (Math.floor(Date.now()/1000) - user_obj.created_at)*4 )) ) await update_account(agent_obj.id, { allocatable_data: dnf(agent_obj.allocatable_data + b2gb(user_obj.data_limit - user_obj.used_traffic)) });
                    await users_clct.deleteOne({ username: db_user.username });
                }
            }

            for (marzban_user of marzban_users) {
                var user = db_users_arr.find(user => user.username == marzban_user.username);
                var all_agents = await accounts_clct.find({ is_admin: 0 }).toArray();

                if (user) {
                    if (user.status == "active" && marzban_user.status == "disabled") await update_user(user.id, { status: "disable", disable: 1 });
                    else if (user.status == "disable" && marzban_user.status == "active") await update_user(user.id, { status: "active", disable: 0 });

                    if (user.expire != marzban_user.expire) await update_user(user.id, { expire: marzban_user.expire });
                    if (user.data_limit != marzban_user.data_limit) await update_user(user.id, { data_limit: marzban_user.data_limit });
                    if (user.used_traffic != marzban_user.used_traffic) {
                        var agent = await get_account(user.agent_id);
                        agent.volume -= marzban_user.used_traffic - user.used_traffic;
                        await update_account(agent.id, { volume: agent.volume });
                        await update_user(user.id, { used_traffic: marzban_user.used_traffic });

                    }


                    if(marzban_user.status == "expired" || marzban_user.status == "limited")
                    {
                        var agent = await get_account(user.agent_id);
                        if(user.disable_counter.value > agent.max_non_active_days)
                        { 
                            var result = await delete_vpn(panel.panel_url, panel.panel_username, panel.panel_password,user.username);
                            if (result != "ERR")  {
                                if( !(agent.business_mode == 1 && (user.used_traffic > user.data_limit/4 || (user.expire - user.created_at) < (Math.floor(Date.now()/1000) - user_obj.created_at)*4 )) ) await update_account(agent.id, { allocatable_data: dnf(agent.allocatable_data + b2gb(user.data_limit - user.used_traffic)) });
                                await users_clct.deleteOne({ username:user.username });
                                console.log("DELETING " + user.username + "...");
                            }  
                        }

                        else if(Math.floor(Date.now() / 1000 ) > user.disable_counter.last_update + 86400)
                        {
                            await update_user(user.id, {disable_counter: {value:user.disable_counter.value+1,last_update: Math.floor(Date.now() / 1000 )}});
                        }
                    }

                    else
                    {
                        if(user.disable_counter.value > 0)
                        {
                            await update_user(user.id, {disable_counter: {value:0,last_update: Math.floor(Date.now() / 1000 )}});
                        }
                    }
                }

                if(!user && marzban_user.username.split("_").length > 1)
                {
                    var corresponding_agent = all_agents.find(agent => agent.prefix == marzban_user.username.split("_")[0]);
                    if(corresponding_agent && corresponding_agent.country.split(",").includes(panel.panel_country) && marzban_user.expire && marzban_user.data_limit)
                    {
                        await insert_to_users({
                            "id": uid(),
                            "agent_id": corresponding_agent.id,
                            "status": marzban_user.status=="active"?"active":"disable",
                            "disable": marzban_user.status=="active"?0:1,
                            "username": marzban_user.username,
                            "expire": marzban_user.expire,
                            "data_limit": marzban_user.data_limit,
                            "used_traffic": 0,
                            "country": panel.panel_country,
                            "corresponding_panel_id": panel.id,
                            "corresponding_panel": panel.panel_url,
                            "subscription_url": panel.panel_url+marzban_user.subscription_url,
                            "links": marzban_user.links,
                            "created_at":Math.floor(Date.parse(marzban_user.created_at)/1000),
                            "disable_counter":{value:0,last_update:Math.floor(Date.now() / 1000)}
                          });

                        await update_account(corresponding_agent.id, { volume: corresponding_agent.volume + marzban_user.data_limit });
                        console.log("user " + marzban_user.username + " was added for agent " + corresponding_agent.username + " from panel : " + panel.panel_url );
                    }
                }
            }
        }


        await sleep(20000);
    }
})();