/* 
mydigitalstructure <> Yodlee Connector
Designed to run on node and AWS lambda
mark.byers@ibcom.biz
See: http://docs.mydigitalstructure.com/gettingstarted_nodejs
Use: https://www.npmjs.com/package/aws-lambda-local
$ lambda-local -f app-1.0.6.js -t 9000 -c settings-private.json -e event.json
*/

exports.handler = function (event, context)
{
	//context = settings

	var _ = require('lodash');
	var moment = require('moment');
	var mydigitalstructure = require('mydigitalstructure');

	var app = {_util: {}, data: {source: {}, destination: {}, event: event}}

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
		if (_.isObject(app.data.event.user))
		{
			if (!_.isUndefined(app.data.event.user.logon))
			{
				mydigitalstructure.data._settings.yodlee.user.logon = app.data.event.user.logon
			}
			
			if (!_.isUndefined(app.data.event.user.password))
			{
				mydigitalstructure.data._settings.yodlee.user.password = app.data.event.user.password
			}
		}

		var defaultPassword = mydigitalstructure.data._settings.yodlee.defaults.password;

		if (_.isUndefined(mydigitalstructure.data._settings.yodlee.user.password) ||
				mydigitalstructure.data._settings.yodlee.user.password == '')
		{	
			mydigitalstructure.data._settings.yodlee.user.password = defaultPassword;
		}

		app.data.yodlee = {settings: mydigitalstructure.data._settings.yodlee};
		mydigitalstructure._util.testing.data(app.data.yodlee.settings, 'app.init##app.data.yodlee.settings');

		app._util.yodlee.init(app.logon);
	}

	app.logon = function ()
	{
		mydigitalstructure._util.testing.data(app.data.yodlee.settings, 'app.logon##app.data.yodlee.settings');
		
		if (app.data.yodlee.settings.user.logon != '')
		{
			app._util.yodlee.logon(app.start);
		}
		else
		{
			app.start();
		}
	}

	app.start = function ()
	{
		mydigitalstructure._util.testing.data(app.data.yodlee.user, 'app.start##app.data.yodlee.user');
		mydigitalstructure._util.testing.data(app.data.yodlee.session, 'app.start##app.data.yodlee.session');
		mydigitalstructure._util.testing.data(app.data.event, 'app.start##app.data.event');

		if (app.data.event.method == 'import/sync')
		{
			app.import.start(app.data.event);
		}

		if (app.data.event.method == 'register/user')
		{
			app.data.event.param.user.password = mydigitalstructure.data._settings.yodlee.defaults.password;
			app.register.user(app.data.event);
		}

		if (app.data.event.method == 'admin/users')
		{
			app.import.prepare.destination.users(app.data.event);
		}

		if (app.data.event.method == 'user/accessTokens')
		{
			app.user.accessTokens(app.data.event);
		}

		if (app.data.event.method == 'user/accounts')
		{
			app.user.accounts(app.data.event);
		}

		if (app.data.event.method == 'user/transactions')
		{
			app.user.accounts(app.data.event);
		}

		if (app.data.event.method == 'user/statements')
		{
			app.user.statements(app.data.event);
		}

		if (app.data.event.method == 'user/summary')
		{
			app.user.summary(app.data.event);
		}
	}

	app.register =
	{
		user: function (options, response)
		{
			if (_.isUndefined(response))
			{
				mydigitalstructure._util.testing.data(mydigitalstructure.data.session, 'app.register##mydigitalstructure.data.session');

				var session = mydigitalstructure.data.session;

				var sendOptions =
				{
					endpoint: 'user/register',
					data: options.param,
					action: options.action
				};

				app._util.yodlee.send(sendOptions, app.register.user)
			}
			else
			{
				app.data.register = response.data.user;
				mydigitalstructure._util.testing.data(response, 'app.register.user::app.data.register');
			}
		}
	}

	app.user =
	{
		data: {},

		accessTokens: function (options, response)
		{
			if (_.isUndefined(response))
			{
				var sendOptions =
				{
					endpoint: options.method,
					query: 'appIds=10003600',
					action: options.action
				};

				app._util.yodlee.send(sendOptions, app.user.accessTokens)
			}
			else
			{
				mydigitalstructure._util.testing.data(response, '_response')
				app.data.accessTokens = response.data.user.accessTokens;
				mydigitalstructure._util.testing.data(app.data.accessTokens, 'app.user.accessTokens::app.data.accessTokens');

				var data = 
				'<form action="https://quickstartaunode.yodlee.com.au/authenticate/quickstarta3/?channelAppName=quickstartau" method="POST">' +
				'<input type="text" name="app" value="10003600" />' +
				'<input type="text" name="rsession" value="' + app.data.yodlee.session.userSession + '"/>' +
				'<input type="text" name="token" value="' + app.data.accessTokens[0].value + '"/>' +
				'<input type="text" name="redirectReq" value="true"/>' +
				'<input type="submit" name="submit" />' +
				'</form>';

				var command =
				'ns1blankspace.util.financial.bankAccounts.link.show({}, {' +
				'userSession: "' + app.data.yodlee.session.userSession + '",' +
				'appToken: "' + app.data.accessTokens[0].value + '"})'

				mydigitalstructure._util.testing.data(data);
				mydigitalstructure._util.testing.data(app.data.yodlee.session.userSession, 'rsession');
				mydigitalstructure._util.testing.data(app.data.accessTokens[0].value, 'token');
				mydigitalstructure._util.testing.data(command);

				var fs = require('fs'); fs.writeFile("yodlee.txt", command, function (err) {})
			}
		},

		accounts: function (options, response)
		{
			if (_.isUndefined(response))
			{
				var sendOptions =
				{
					endpoint: 'accounts',
					query: ''
				};

				app._util.yodlee.send(sendOptions, app.user.accounts)
			}
			else
			{
				mydigitalstructure._util.testing.data(response.data.account, 'app.user.accounts::response.data.account');

				app.user.data.accounts = response.data.account;
				app._util.show.accounts({accounts: app.user.data.accounts});

				if (app.data.event.method == 'user/transactions')
				{
					var accounts = app.user.data.accounts;

					if (app.data.event.accountNumber != undefined)
					{
						accounts = _.filter(accounts, function (a) {return (a.accountNumber == app.data.event.accountNumber)})
					}
					
					options = _.assign(options, {accountIDs: _.map(accounts, 'id')})

					mydigitalstructure._util.testing.data(app.data.event, 'app.user.accounts::event');
					mydigitalstructure._util.testing.data(options, 'app.user.accounts::options');
					
					app.user.transactions(options);
					app.user.summary(options);
				}	
			}
		},

		statements: function (options, response)
		{
			if (_.isUndefined(response))
			{
				var sendOptions =
				{
					endpoint: 'statements',
					query: 'isLatest=false'
				};

				app._util.yodlee.send(sendOptions, app.user.statements)
			}
			else
			{
				mydigitalstructure._util.testing.data(response.data.statement, 'app.user.statements::response.data.statement');

				//app.user.data.accounts = response.data.account;
				//app._util.show.accounts({accounts: app.user.data.accounts});
			}
		},

		summary: function (options, response)
		{
			if (_.isUndefined(response))
			{
				var sendOptions =
				{
					endpoint: 'derived/transactionSummary',
					query: 'groupBy=CATEGORY&categoryType=INCOME&interval=M&include=details&accountId=' + options.accountIDs
				};

				app._util.yodlee.send(sendOptions, app.user.summary)
			}
			else
			{
				mydigitalstructure._util.testing.data(response, 'app.user.summary::response.data.transactionSummary');

				//app.user.data.accounts = response.data.account;
				//app._util.show.accounts({accounts: app.user.data.accounts});
			}
		},

		transactions: function (options, response)
		{
			//https://developer.yodlee.com/apidocs/index.php#!/transactions/getTransactions
			//https://developer.api.yodlee.com:443/ysl/restserver/v1/transactions?accountId=10916521&fromDate=2000-01-01

			if (_.isUndefined(response))
			{
				if (_.isUndefined(options.fromDate)) {options.fromDate = '2000-01-01'}

				var sendOptions =
				{
					endpoint: 'transactions',
					query: 'accountId=' + options.accountIDs + '&fromDate=' + options.fromDate
				};

				mydigitalstructure._util.testing.data(sendOptions, 'app.user.transactions::options');

				app._util.yodlee.send(sendOptions, app.user.transactions)
			}
			else
			{
				//app.user.data.transactions = response.data.transaction;
				app.user.data.transactions = _.filter(response.data.transaction, function (transaction) {return transaction.status.toUpperCase() == 'POSTED'})

				mydigitalstructure._util.testing.data(app.user.data.transactions, 'app.user.transactions::app.data.source.transactions');
				app._util.show.transactions({transactions: app.user.data.transactions});
			}
		}	
	}

	app.import = 
	{
		data: {source: {}, destination: {}},

		start: function (options)
		{
			app.import.prepare.destination.users(options) // calls app.import.sync
		},

		sync: function ()
		{
			mydigitalstructure._util.testing.data(app.import.data.users, 'app.import.sync::app.import.data.users');

			if (_.isUndefined(_.find(app.import.data.users, function (user) {return !user.processed})))
			{
				mydigitalstructure._util.testing.message('ALL USERS DONE!!', 'app.import.sync');
			}
			else
			{
				app.import.data.user = _.find(app.import.data.users, function (user) {return !user.processed});
				app.data.yodlee.settings.user = app.import.data.user;

				mydigitalstructure._util.testing.data(app.import.data.user, 'app.import.sync::app.import.data.user');
				app._util.yodlee.logon(app.import.process.destination.switchSpace);
			}
		},
				
		prepare:
		{
			source:
			{
				accounts: function (options, response)
				{
					if (_.isUndefined(response))
					{
						var sendOptions =
						{
							endpoint: 'accounts',
							query: ''
						};

						app._util.yodlee.send(sendOptions, app.import.prepare.source.accounts)
					}
					else
					{
						app.import.data.source.accounts = response.data.account;
						mydigitalstructure._util.testing.data(app.import.data.source.accounts, 'app.import.prepare.source.accounts::app.import.data.source.accounts');

						app._util.show.accounts();
						app.import.prepare.destination.accounts();
					}
				},

				transactions: function (options, response)
				{
					//https://developer.yodlee.com/apidocs/index.php#!/transactions/getTransactions
					//https://developer.api.yodlee.com:443/ysl/restserver/v1/transactions?accountId=10916521&fromDate=2000-01-01

					if (_.isUndefined(response))
					{
						if (_.isUndefined(options.fromDate)) {options.fromDate = '2000-01-01'}

						var sendOptions =
						{
							endpoint: 'transactions',
							query: 'accountId=' + options.accountIDs + '&fromDate=' + options.fromDate
						};

						mydigitalstructure._util.testing.data(sendOptions, 'app.import.prepare.source.transactions::options');

						app._util.yodlee.send(sendOptions, app.import.prepare.source.transactions)
					}
					else
					{
						//app.import.data.source.transactions = response.data.transaction;
						app.import.data.source.transactions = _.filter(response.data.transaction, function (transaction) {return transaction.status.toUpperCase() == 'POSTED'})

						_.each(app.import.data.source.transactions, function (transaction) {transaction.transactionDate = transaction.date});
						
						mydigitalstructure._util.testing.data(app.import.data.source.transactions, 'app.import.prepare.source.transactions::app.import.data.source.transactions');

						if (mydigitalstructure._util.testing.status())
						{	
							app._util.show.transactions();
						}	

						app.import.process.destination.sources();
					}
				}	
			},

			destination:
			{
				users: function (options, response)
				{
					if (_.isUndefined(response))
					{
						var sendOptions = 
						{
							url: '/rpc/core/?method=CORE_SPACE_SEARCH&advanced=1'
						};

						mydigitalstructure.send(sendOptions,
							'criteria={"fields":[{"name":"space"},{"name":"spacetext"},{"name":"etag"}],"options":{"rows":1000}}',
							app.import.prepare.destination.users,
							options);
					}
					else
					{
						var defaultPassword = mydigitalstructure.data._settings.yodlee.defaults.password;
						var defaultUserPrefix = mydigitalstructure.data._settings.yodlee.defaults.userPrefix;
						var spacesAccess = JSON.parse(response).data.rows;

						if (_.isObject(mydigitalstructure.data._settings.yodlee.user))
						{
							if (mydigitalstructure.data._settings.yodlee.user.logon != '' &&
									mydigitalstructure.data._settings.yodlee.user.logon != undefined)
							{
								spacesAccess = _.filter(spacesAccess, function (spaceAccess)
								{
									return spaceAccess.space == _.last(_.split(mydigitalstructure.data._settings.yodlee.user.logon, '-'))
								})
							}	
						}
						
						app.import.data.users = []

						_.each(spacesAccess, function (access)
						{
							app.import.data.users.push(
							{
								processed: false,
								password: defaultPassword,
								logon: defaultUserPrefix + access.space,
								spaceaccessid: access.id,
								spacetext: access.spacetext
							});
						})

						if (app.data.event.method == 'import/sync')
						{
							app.import.sync();
						}
						else if (app.data.event.method == 'admin/users')
						{
							mydigitalstructure._util.testing.data(app.import.data.users, 'app.import.prepare.users');
						}
					}
				},

				accounts: function (options, response)
				{
					if (_.isUndefined(response))
					{
						mydigitalstructure.send(
						{
							url: '/rpc/financial/?method=FINANCIAL_BANK_ACCOUNT_SEARCH&advanced=1'
						},
						'criteria={"fields":[{"name":"title"},{"name":"bank"},{"name":"bsb"},{"name":"accountnumber"},{"name":"accountname"}],"filters":[{"name": "status","comparison":"EQUAL_TO","value1":"1"}],"options":{"rows":50}}',
						app.import.prepare.destination.accounts);
					}
					else
					{
						if (JSON.parse(response).status == 'ER')
						{
							//log error
							mydigitalstructure._util.testing.message('ERROR!! (' + JSON.parse(response).error.errornotes + ')', 'app.import.prepare.accounts');

							var user = _.find(app.import.data.users, function (user) {return user.logon == app.import.data.user.logon})
							user.processed = true;
							app.import.process.destination.switchBack({message: 'User: ' + app.import.data.user.logon + '/' + app.import.data.user.spacetext + ': ' + JSON.parse(response).error.errornotes});
						}
						else
						{
							app.import.data.destination.accounts = JSON.parse(response).data.rows;

							_.each(app.import.data.destination.accounts, function (account)
							{
								account._accountnumber = 'xxxx' + account.accountnumber.slice(-4);
							})

							mydigitalstructure._util.testing.data(app.import.data.destination.accounts, 'app.import.prepare.destination.accounts::app.import.data.destination.accounts');

							app.import.process.source.accounts.init()
						}	
					}
				},

				sources: function (options, response)
				{
					if (_.isUndefined(response))
					{
						var criteria = mydigitalstructure._util.search.init();
						criteria.fields.push({"name":"bankaccount"},{"name":"bankaccounttext"},{"name":"enddate"},{"name":"startdate"},{"name":"notes"})
						criteria.options.rows = 1
						criteria.filters.push({"name":"bankaccount", "comparison":"EQUAL_TO", "value1": options.bankAccountID});
						criteria.sorts.push({"name":"id", "direction":"desc"})

						mydigitalstructure.send(
						{
							url: '/rpc/financial/?method=FINANCIAL_BANK_ACCOUNT_TRANSACTION_SOURCE_SEARCH&advanced=1',
							bankAccountID: options.bankAccountID
						},
						'criteria=' + JSON.stringify(criteria),
						app.import.prepare.destination.sources);
					}
					else
					{
						app.import.data.destination.sources = JSON.parse(response).data.rows;

						mydigitalstructure._util.testing.data(app.import.data.destination.sources, 'app.import.prepare.destination.sources::app.import.data.destination.sources');

						var reducedAccount = _.find(app.import.data.source.reducedAccounts, function (account) {return account.destinationAccountID == options.bankAccountID})

						var options =
						{
							fromDate: '2000-01-01',
							accountIDs: reducedAccount.id
						}

						if (_.size(app.import.data.destination.sources) != 0)
						{
							var lastSource = _.first(app.import.data.destination.sources);

							mydigitalstructure._util.testing.data(lastSource, 'app.import.prepare.destination.sources::lastSource');

							if (moment(lastSource.enddate, 'DD MMM YYYY').isValid())
							{
								if (_.includes(lastSource.notes, 'source:YODLEE'))
								{
									//Just in case the last imports have failed -- use startdate if it was YODLEE import
									options.fromDate = moment(_.first(app.import.data.destination.sources).startdate, 'DD MMM YYYY').add(0, 'days').format('YYYY-MM-DD');
								}
								else
								{
									options.fromDate = moment(_.first(app.import.data.destination.sources).enddate, 'DD MMM YYYY').add(1, 'days').format('YYYY-MM-DD');
								}	
							}
						}
						
						mydigitalstructure._util.testing.data(options, 'app.import.prepare.destination.sources::transaction-options');

						app.import.prepare.source.transactions(options)
					}
				},
					
				transactions: function (options, response)
				{
					if (_.isUndefined(response))
					{
						var criteria = mydigitalstructure._util.search.init();
						criteria.fields.push({"name":"externalid"},{"name":"amount"},{"name":"posteddate"})
						criteria.options.rows = 1000;
						criteria.filters.push({"name":"posteddate", "comparison":"GREATER_THAN_OR_EQUAL_TO", "value1": app.import.process.data.transactionMin.transactionDate});
						criteria.filters.push({"name":"bankaccount", "comparison":"EQUAL_TO", "value1": app.import.process.data.processSourceAccount.destinationAccountID});
						criteria.sorts.push({"name":"id", "direction":"desc"})

						mydigitalstructure.send(
						{
							url: '/rpc/financial/?method=FINANCIAL_BANK_ACCOUNT_TRANSACTION_SEARCH&advanced=1'
						},
						'criteria=' + JSON.stringify(criteria),
						app.import.prepare.destination.transactions);
					}
					else
					{
						app.import.data.destination.transactions = JSON.parse(response).data.rows;

						if (JSON.parse(response).morerows == "true") 
						{
							mydigitalstructure._util.testing.message('!Warning:Too many transactions.', 'app.import.prepare.destination.transactions');
							//send email based on settings
						}
						else
						{
							mydigitalstructure._util.testing.data(app.import.data.destination.transactions, 'app.import.prepare.destination.transactions::app.import.data.destination.transactions');
							app.import.process.destination.transactions.init();
						}
					}
				}
			}		
		},

		process:
		{
			data: {},

			source:
			{
				accounts: 
				{
					init: function ()
					{
						var destinationAccounts = app.import.data.destination.accounts; //mydigitalstructure
						var sourceAccounts = app.import.data.source.accounts; //Yodlee

						_.each(sourceAccounts, function (sourceAccount)
						{
							sourceAccount.processed = false;

							sourceAccount.destinationAccount = _.find(destinationAccounts, function(destinationAccount)
							{
								return sourceAccount.accountNumber == destinationAccount._accountnumber
							});

							if (_.isObject(sourceAccount.destinationAccount)) {sourceAccount.destinationAccountID = sourceAccount.destinationAccount.id} 
						});

						var reducedSourceAccounts = _.filter(sourceAccounts, function (sourceAccount)
						{
							return (sourceAccount.destinationAccountID != undefined)
						});

						app.import.data.source.reducedAccounts = reducedSourceAccounts;

						mydigitalstructure._util.testing.data(app.import.data.source.reducedAccounts, 'app.import.process.source.accounts::reducedAccounts');

						if (mydigitalstructure._util.testing.status())
						{
							app._util.show.accounts({accounts: reducedSourceAccounts});
						}	

						app.import.process.source.accounts.sync()
					},
					
					sync: function ()
					{
						if (_.isUndefined(_.find(app.import.data.source.reducedAccounts, function (account) {return !account.processed})))
						{
							mydigitalstructure._util.testing.message('ALL DONE!!', 'app.import.process.source.accounts.sync');

							var user = _.find(app.import.data.users, function (user) {return user.logon == app.import.data.user.logon})
							user.processed = true;
							app.import.process.destination.switchBack();
							//app.import.sync() //do next user, call by switchBack
						}
						else
						{
							app.import.process.data.processSourceAccount = _.find(app.import.data.source.reducedAccounts, function (account) {return !account.processed});
							app.import.prepare.destination.sources({bankAccountID: app.import.process.data.processSourceAccount.destinationAccountID});
						}
					}	
				}
			},

			destination:
			{
				switchSpace: function (options, response)
				{
					if (_.isUndefined(response))
					{
						var user = _.find(app.import.data.users, function (user) {return user.logon == app.import.data.user.logon});
						mydigitalstructure._util.testing.data(user, 'app.import.process.destination.sources::user');

						var data = 'switch=1&id=' + user.spaceaccessid;

						mydigitalstructure.send(
						{
							url: '/rpc/core/?method=CORE_SPACE_MANAGE'
						},
						data,
						app.import.process.destination.switchSpace);
					}
					else
					{
						var access = JSON.parse(response);

						mydigitalstructure._util.testing.data(access, 'app.import.process.destination.switchSpace::access');

						if (access.status == 'ER')
						{
							mydigitalstructure._util.testing.data(access, 'ER/app.import.process.destination.switchSpace');
						}
						else
						{
							app.import.prepare.source.accounts()
						}
					}	
				},

				switchBack: function (options, response)
				{
					if (_.isUndefined(response))
					{
						var data = 'switchback=1'

						mydigitalstructure.send(
						{
							url: '/rpc/core/?method=CORE_SPACE_MANAGE'
						},
						data,
						app.import.process.destination.switchBack,
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
									var data = 'to=mark.byers@ibcom.biz&fromemail=support@ibcom.biz&subject=[Yodlee Import] ' + options.message

									mydigitalstructure.send(
									{
										url: '/rpc/messaging/?method=MESSAGING_EMAIL_SEND'
									},
									data);
								}
							}

							app.import.sync()
						}
					}	
				},

				sources: function (options, response)
				{
					if (_.isUndefined(response))
					{
						if (_.size(app.import.data.source.transactions) != 0)
						{
							//get min/max dates from app.import.data.source.transactions
							app.import.process.data.transactionMax = _.maxBy(app.import.data.source.transactions, function(transaction) {return moment(transaction.transactionDate, 'YYYY-MM-DD')});
							app.import.process.data.transactionMin = _.minBy(app.import.data.source.transactions, function(transaction) {return moment(transaction.transactionDate, 'YYYY-MM-DD')});

							var startDate = moment(app.import.process.data.transactionMin.transactionDate, 'YYYY-MM-DD').format('DD MMM YYYY');

							mydigitalstructure._util.testing.data(startDate, 'app.import.process.destination.sources::startdate');

							if (_.size(app.import.data.destination.sources) != 0)
							{
								mydigitalstructure._util.testing.data(_.first(app.import.data.destination.sources).enddate, 'app.import.process.destination.sources::enddate');

								if (_.first(app.import.data.destination.sources).enddate != '')
								{
									startDate = moment(_.first(app.import.data.destination.sources).enddate, 'DD MMM YYYY').add(1, 'days').format('DD MMM YYYY');
								}	
							}
							
							mydigitalstructure._util.testing.data(startDate, 'app.import.process.destination.sources::startdate-2');

							var endDate = moment(app.import.process.data.transactionMax.transactionDate, 'YYYY-MM-DD').format('DD MMM YYYY');

							if (moment(endDate, 'DD MMM YYYY').isBefore(moment(startDate, 'DD MMM YYYY')))
							{
								startDate = endDate 
							}

							var data = 'bankaccount=' + app.import.process.data.processSourceAccount.destinationAccountID +
										'&startdate=' + startDate +
										'&enddate=' + endDate +
										'&processeddate=' + moment().format('DD MMM YYYY') +
										'&notes={source:YODLEE}'; 

							mydigitalstructure._util.testing.data(data, 'app.import.process.destination.sources##data')		

							mydigitalstructure.send(
							{
								url: '/rpc/financial/?method=FINANCIAL_BANK_ACCOUNT_TRANSACTION_SOURCE_MANAGE'
							},
							data,
							app.import.process.destination.sources);
						}
						else
						{
							if (JSON.parse(response).status == 'ER')
							{
								mydigitalstructure._util.testing.message('ERROR!! (' + JSON.parse(response).error.errornotes + ')', 'app.import.process.destination.sources');
							}
							
							var user = _.find(app.import.data.users, function (user) {return user.id == app.import.data.user.id})
							user.processed = true;
							app.import.sync() //do next user	
						}
					}
					else
					{
						app.import.data.destination.processSourceID = JSON.parse(response).id;

						mydigitalstructure._util.testing.data(app.import.data.destination.processSourceID, 'app.import.process.destination.sources::sourceid');

						app.import.prepare.destination.transactions()
					}
				},

				transactions: 
				{
					init: function (options, response)
					{
						//Go through transactions and add to destination

						app.import.process.data.destinationTransactions = [];

						_.each(app.import.data.source.transactions, function (sourceTransaction)
						{
							sourceTransaction.processed = _.isObject(_.find(app.import.data.destination.transactions, function (destinationTransaction)
							{
								return sourceTransaction.id == destinationTransaction.externalid
							}));

						});

						app.import.process.destination.transactions.send();
					},

					send: function (options, response)
					{
						app.import.data.source.processTransaction = _.find(app.import.data.source.transactions, function (transaction) {return !transaction.processed})

						if (_.isObject(app.import.data.source.processTransaction))
						{
							var transaction = app.import.data.source.processTransaction;

							var data =
							{
								source: app.import.process.data.destinationSourceID,
								externalid: transaction.id,
								amount: transaction.amount.amount,
								posteddate: moment(transaction.transactionDate, 'YYYY-MM-DD').format('DD MMM YYYY'),
								bankaccount: app.import.process.data.processSourceAccount.destinationAccountID,
								source: app.import.data.destination.processSourceID,
								notes: transaction.description.original,
								status: 1
							}

							data.type = 1; //Credit
							data.category = 1;
							if (_.upperCase(transaction.baseType) == 'DEBIT')
							{
								data.type = 2;
								data.category = 2;
								data.amount = data.amount * -1
							}

							mydigitalstructure._util.testing.data(data, 'app.import.process.destination.transactions.send::data');

							mydigitalstructure.send(
							{
								url: '/rpc/financial/?method=FINANCIAL_BANK_ACCOUNT_TRANSACTION_MANAGE'
							},
							data,
							app.import.process.destination.transactions.finalise);
						}
						else
						{
							if (_.size(app.import.process.data.destinationTransactions) == 0)
							{
								var data =
								{
									id: app.import.data.destination.processSourceID,
									remove: 1
								}

								mydigitalstructure.send(
								{
									url: '/rpc/financial/?method=FINANCIAL_BANK_ACCOUNT_TRANSACTION_SOURCE_MANAGE'
								},
								data,
								app.import.process.destination.transactions.done);
							}
							else
							{
								app.import.process.destination.transactions.done();
							}
						}	
					},

					finalise: function (options, response)
					{
						if (JSON.parse(response).status == 'ER')
						{
							mydigitalstructure._util.testing.message('ERROR: ' + app.import.data.user.logon + ': (' + JSON.parse(response).error.errornotes + ')', 'app.import.process.destination.transactions.send');
						}
						else
						{
							app.import.process.data.destinationTransactions.push(JSON.parse(response).id);

							var sourceTransaction = _.find(app.import.data.source.transactions, function (transaction) {return transaction.id == app.import.data.source.processTransaction.id})
							sourceTransaction.processed = true;
							app.import.process.destination.transactions.send();
						}	
					},

					done: function ()
					{
						var sourceAccount = _.find(app.import.data.source.reducedAccounts, function (account) {return account.id == app.import.process.data.processSourceAccount.id})
						sourceAccount.processed = true;

						mydigitalstructure._util.testing.message(sourceAccount.accountName + ' / ' + _.size(app.import.process.data.destinationTransactions) + ' transaction(s)', 'app.import.process.destination.transactions::!DONE');

						app.import.process.source.accounts.sync();
					}		
				}
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
				{caption: 'Provider', param: 'providerName'},
				{caption: 'Provider-ID', param: 'providerAccountId'},
				{caption: 'Account-ID', param: 'id'},
				{caption: 'Account-Type', param: 'CONTAINER'},
				{caption: 'Account-Name', param: 'accountName'},
				{caption: 'Account-Number', param: 'accountNumber'},
				{caption: 'Account-Balance', parentParam: 'balance', param: 'amount'},
				{caption: 'Account-Balance-As-At', parentParam: 'refreshinfo', param: 'lastRefreshed'}
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
		},

		transactions: function (options)
		{
			var showData;
			var showHeader =
			[
				{caption: 'Account-ID', param: 'accountId'},
				{caption: 'Account-Running-Balance', parentParam: 'runningBalance', param: 'amount'},
				{caption: 'Tran-ID', param: 'id'},
				{caption: 'Tran-Date', param: 'date'},
				{caption: 'Tran-Status', param: 'status'},
				{caption: 'Tran-Cheque-Number', param: 'checkNumber'},
				{caption: 'Tran-Type', param: 'baseType'},
				{caption: 'Tran-Amount', parentParam: 'amount', param: 'amount'},
				{caption: 'Tran-Description', parentParam: 'description', param: 'original'},
				{caption: 'Tran-Description-Simple', parentParam: 'description', param: 'simple'},
				{caption: 'Tran-Created-At-Source-Date', param: 'createdDate'}
			];

			console.log(_.join(_.map(showHeader, 'caption'), ', '));

			var transactions = app.import.data.source.transactions

			if (!_.isUndefined(options))
			{
				if (!_.isUndefined(options.transactions)) {transactions = options.transactions}
			}

			_.each(transactions, function (data)
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

	app._util.yodlee =
	{
		init: function (callBack)
				{
					var https = require('https');
					
					var requestData =
					{
						cobrand:
						{
							cobrandLogin: app.data.yodlee.settings.cobrand.logon,
							cobrandPassword: app.data.yodlee.settings.cobrand.password,
							locale: 'en_US'
						}
					}

					var _requestData = JSON.stringify(requestData)

					var requestOptions =
					{
						hostname: app.data.yodlee.settings.hostname,
						port: 443,
						path: app.data.yodlee.settings.basepath + '/cobrand/login',
						method: 'POST',
						headers:
						{
							'Content-Type': 'application/json',
							"Content-Length": Buffer.byteLength(_requestData)
						}
					};

					var req = https.request(requestOptions, function(res)
					{
						res.setEncoding('utf8');

						var data = '';
						
						res.on('data', function(chunk)
						{
						  	data += chunk;
						});
						
						res.on('end', function ()
						{	
							app.data.yodlee.session = JSON.parse(data);
							app.data.yodlee.session.cobSession = app.data.yodlee.session.session.cobSession;
					    	if (_.isFunction(callBack)) {callBack({data: app.data.yodlee.session})};
						});
					});

					req.on('error', function(error)
					{
					  	if (callBack) {callBack({error: error})};
					});

					req.end(_requestData)
				},

		logon: function (callBack)
				{
					var https = require('https');
					
					var requestData =
					{
						user:
						{
							loginName: app.data.yodlee.settings.user.logon,
							password: app.data.yodlee.settings.user.password,
							locale: 'en_US'
						}
					}

					var _requestData = JSON.stringify(requestData)

					var requestOptions =
					{
						hostname: app.data.yodlee.settings.hostname,
						port: 443,
						path: app.data.yodlee.settings.basepath + '/user/login',
						method: 'POST',
						headers:
						{
							'Content-Type': 'application/json',
							'Content-Length': Buffer.byteLength(_requestData),
							'Authorization': 'cobSession=' + app.data.yodlee.session.cobSession
						}
					};

					var req = https.request(requestOptions, function(res)
					{
						res.setEncoding('utf8');

						var data = '';
						
						res.on('data', function(chunk)
						{
						  	data += chunk;
						});
						
						res.on('end', function ()
						{	
							mydigitalstructure._util.testing.data(JSON.parse(data), 'yodlee.logon::response');

							if (JSON.parse(data).user != undefined)
							{
								app.data.yodlee.user = JSON.parse(data).user;
								app.data.yodlee.session.userSession = app.data.yodlee.user.session.userSession;
							}		
					
						   if (_.isFunction(callBack)) {callBack({data: app.data.yodlee.user})};
						});
					});

					req.on('error', function(error)
					{
					  	if (callBack) {callBack({error: error})};
					});

					req.end(_requestData)
				},

		send: function (options, callBack)
				{
					var https = require('https');
					
					if (_.isUndefined(options.action)) {options.action = 'GET'};

					var userSession = '';

					if (app.data.yodlee.session.userSession != undefined)
					{
						userSession = ', userSession=' + app.data.yodlee.session.userSession
					}

					var headers =
					{
						'Authorization': 'cobSession=' + app.data.yodlee.session.cobSession + userSession
					}

					var _requestData;

					if (_.isObject(options.data))
					{
						_requestData = JSON.stringify(options.data);

						headers['Content-Type'] = 'application/json';
						headers['Content-Length'] = Buffer.byteLength(_requestData);
					}

					var requestOptions =
					{
						hostname: app.data.yodlee.settings.hostname,
						port: 443,
						path: app.data.yodlee.settings.basepath + '/' + options.endpoint + (options.query!=undefined?'/?' + options.query:''),
						method: options.action,
						headers: headers
					};

					mydigitalstructure._util.testing.data(requestOptions, 'send-requestOptions');
					mydigitalstructure._util.testing.data(_requestData, 'send-requestData');

					var req = https.request(requestOptions, function(res)
					{
						res.setEncoding('utf8');

						var data = '';
						
						res.on('data', function(chunk)
						{
						  	data += chunk;
						});
						
						res.on('end', function ()
						{	
							dataResponse = JSON.parse(data);
					    	if (_.isFunction(callBack)) {callBack(options, {data: dataResponse})};
						});
					});

					req.on('error', function(error)
					{
					  	if (callBack) {callBack({error: error})};
					});

					req.end(_requestData)
				}				
	}
}					