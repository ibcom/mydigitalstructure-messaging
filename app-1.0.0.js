/* 
mydigitalstructure Messaging Service
Designed to run on node and AWS lambda
mark.byers@ibcom.biz
See: http://docs.mydigitalstructure.com/gettingstarted_nodejs
Use: https://www.npmjs.com/package/aws-lambda-local
$ lambda-local -f app-1.0.0.js -t 9000 -c settings-private.json -e event.json
*/

exports.handler = function (event, context)
{
	//context = settings

	var _ = require('lodash');
	var moment = require('moment');
	var mydigitalstructure = require('mydigitalstructure');

	var app = {_util: {}, data: {event: event}}

	mydigitalstructure.init(main, context)

	mydigitalstructure._util.testing.data(event, 'event');

	function main(err, data)
	{
		if (mydigitalstructure.data.session.status == "OK")
		{
			app.init()
		}	
	}

	app.init = function ()
	{
		app.start();
	}

	app.start = function ()
	{
		mydigitalstructure._util.testing.data(app.data.event, 'app.start##app.data.event');

		if (app.data.event.method == 'import/email')
		{
			app.import.start(app.data.event);
		}

		if (app.data.event.method == 'admin/spaces')
		{
			app.import.prepare.spaces(app.data.event);
		}
	}

	app.import = 
	{
		data: {},

		start: function (options)
		{
			app.import.prepare.spaces(options)
		},

		sync: function ()
		{
			//mydigitalstructure._util.testing.data(app.import.data.spaces, 'app.import.sync::app.import.data.spaces');

			app.import.data.space = _.find(app.import.data.spaces, function (space) {return !space.processed})

			if (_.isUndefined(app.import.data.space))
			{
				mydigitalstructure._util.testing.message('ALL SPACES DONE!!', 'app.import.sync');
			}
			else
			{
				mydigitalstructure._util.testing.data(app.import.data.space, 'app.import.sync::app.import.data.space');
				app.import.switchSpace();
			}
		},
				
		prepare:
		{
			spaces: function (options, response)
			{
				if (_.isUndefined(response))
				{
					var sendOptions = 
					{
						url: '/rpc/core/?method=CORE_SPACE_SEARCH&advanced=1'
					};

					mydigitalstructure.send(sendOptions,
						'criteria={"fields":[{"name":"space"},{"name":"spacetext"},{"name":"etag"}],"options":{"rows":1000}}',
						app.import.prepare.spaces,
						options);
				}
				else
				{
					var spacesAccess = JSON.parse(response).data.rows;

					if (_.isObject(app.data.event))
					{
						if (app.data.event.space != '' &&
								app.data.event.space != undefined)
						{
							spacesAccess = _.filter(spacesAccess, function (spaceAccess)
							{
								return spaceAccess.space == app.data.event.space
							})
						}	
					}
					
					app.import.data.spaces = []

					_.each(spacesAccess, function (access)
					{
						app.import.data.spaces.push(
						{
							processed: false,
							id: access.space,
							accessid: access.id,
							text: access.spacetext
						});
					})

					mydigitalstructure._util.testing.data(app.data.event.method, 'app.import.prepare.spaces');

					if (app.data.event.method == 'import/email')
					{
						app.import.sync();
					}
					else if (app.data.event.method == 'admin/spaces')
					{
						mydigitalstructure._util.testing.data(app.import.data.spaces, 'app.import.prepare.spaces');
					}
				}
			},

			accounts: function (options, response)
			{
				if (_.isUndefined(response))
				{
					mydigitalstructure.send(
					{
						url: '/rpc/messaging/?method=SETUP_MESSAGING_ACCOUNT_SEARCH&advanced=1'
					},
					'criteria={"fields":[{"name":"title"},{"name":"email"},{"name":"server"}],"filters":[{"name": "type","comparison":"EQUAL_TO","value1":"5"}],"options":{"rows":50}}',
					app.import.prepare.accounts);
				}
				else
				{
					if (JSON.parse(response).status == 'ER')
					{
						mydigitalstructure._util.testing.message('ERROR!! (' + JSON.parse(response).error.errornotes + ')', 'app.import.prepare.accounts');
						app.import.switchBack({message: 'Space: ' + app.import.data.space.id + '/' + app.import.data.space.text + ': ' + JSON.parse(response).error.errornotes});
					}
					else
					{
						app.import.data.accounts = JSON.parse(response).data.rows;

						mydigitalstructure._util.testing.data(app.import.data.accounts, 'app.import.prepare.accounts::app.import.data.accounts');
						app.import.process.accounts.init()
					}	
				}
			}	
		},

		process:
		{
			data: {},

			accounts: 
			{
				init: function ()
				{
					app.import.process.accounts.sync()
				},
				
				sync: function ()
				{
					app.import.data.account = _.find(app.import.data.accounts, function (account) {return !account.processed})

					if (_.isUndefined(app.import.data.account))
					{
						mydigitalstructure._util.testing.message('ALL DONE!!', 'app.import.process.accounts.sync');
						app.import.switchBack();
					}
					else
					{
						mydigitalstructure._util.testing.message(app.import.data.account, 'app.import.process.accounts.sync');

						var data = 'account=' + app.import.data.account.id;

						mydigitalstructure.send(
						{
							url: '/rpc/messaging/?method=MESSAGING_EMAIL_CACHE_CHECK'
						},
						data,
						app.import.process.accounts.done);
					}
				},

				done: function (param, data)
				{
					var account = _.find(app.import.data.accounts, function (account) {return account.id == app.import.data.account.id})
					account.processed = true;

					mydigitalstructure._util.testing.message(app.import.data.account, 'app.import.process.accounts.sync::DONE!');

					app.import.process.accounts.sync();
				}	
			}	
		},

		switchSpace: function (options, response)
		{
			if (_.isUndefined(response))
			{
				var data = 'switch=1&id=' + app.import.data.space.accessid;

				mydigitalstructure.send(
				{
					url: '/rpc/core/?method=CORE_SPACE_MANAGE'
				},
				data,
				app.import.switchSpace);
			}
			else
			{
				var access = JSON.parse(response);

				mydigitalstructure._util.testing.data(access, 'app.import.process.destination.switchSpace::access');

				if (access.status == 'ER')
				{
					mydigitalstructure._util.testing.data(access, 'ER/app.import.process.switchSpace');
					app.import.switchBack()
				}
				else
				{
					app.import.prepare.accounts();
				}
			}	
		},

		switchBack: function (options, response)
		{
			if (_.isUndefined(response))
			{
				var space = _.find(app.import.data.spaces, function (space) {return space.id == app.import.data.space.id})
				space.processed = true;

				var data = 'switchback=1'

				mydigitalstructure.send(
				{
					url: '/rpc/core/?method=CORE_SPACE_MANAGE'
				},
				data,
				app.import.switchBack,
				options);
			}
			else
			{
				var access = JSON.parse(response);

				if (access.status == 'ER')
				{
					mydigitalstructure._util.testing.data(access, 'ER/app.import.process.destination.switchBack');
				}
				else
				{
					if (options != undefined)
					{
						if (options.message != undefined)
						{
							var data = 'to=mark.byers@ibcom.biz&fromemail=support@ibcom.biz&subject=[Messaging (Email Check) Service] ' + options.message

							mydigitalstructure.send(
							{
								url: '/rpc/messaging/?method=MESSAGING_EMAIL_SEND'
							},
							data);
						}
					}	
				}

				app.import.sync()
			}	
		}
	}	

	app._util.show = 
	{
		accounts: function (options)
		{
			var showData;
			var showHeader =
			[
				{caption: 'Email', param: 'email'},
			];

			console.log(_.join(_.map(showHeader, 'caption'), ', '));

			var accounts = app.import.data.source.accounts;

			if (!_.isUndefined(options))
			{
				if (!_.isUndefined(options.accounts)) {accounts = options.accounts}
			}

			_.each(accounts, function (data)
			{
				showData = [];
				
				_.each(showHeader, function (header)
				{
					if (_.isUndefined(header.parentParam))
					{
						showData.push(data[header.param])
					}
					else
					{
						if (_.isUndefined(data[header.parentParam]))
						{
							showData.push('-')
						}
						else
						{
							showData.push(data[header.parentParam][header.param])
						}	
					}
				});

				console.log(_.join(showData, ', '));

			});
		}
	}	
}					