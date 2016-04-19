#**app-qa**
Sample app for QA

App QA is an node.js application demonstrating basic integrated app permissions

####**Using QA**

Assuming it's already been setup in the dev-portal, you should be able to signup for the app in the appstore, then use
the [+] menu to add the application to a document.

####**Deploying to Heroku**
Make sure you have Node.js and the Heroku Toolbelt installed. You will also need a Heroku account
([signup for free](https://www.heroku.com/)).

Execute the following commands to create a duplicate of a repository; you need to perform both a bare-clone and a
mirror-push to an newly-created bare repo (please note that you may want to use SSH instead of HTTPS, depending on your
Github settings):

    $ git clone --bare https://github.com/onshape/app-qa-cloud.git
       # make a bare clone of the repository
    
    $ cd app-qa-cloud.git
    $ git push --mirror https://github.com/exampleuser/new-respository.git
       # mirror-push to new respository
       
    $ cd ..
    $ rm -rf app-qa-cloud.git
      # remove temporary local repository

######Deploy your repo on heroku

    $ git clone https://github.com/exampleuser/new-respository.git 
    $ cd new-repository
    $ heroku create

To register the new app, go to the Dev Portal, (Example: https://dev-portal.dev.onshape.com).
Register a new OAuth application.  The output from Heroku should produce a new domain name to use for the
iframe and redirect urls:

    Application name (ex: Onshape QA Sample)
    Application summary (one sentence; ex: "Onshape QA Sample application — source code is available.")
    iframe URL (ex: https://newURL-from-heroku.herokuapp.com/oauthSignin)
    Redirect URLs (ex: https://newURL-from-heroku.herokuapp.com/oauthRedirect)
    Requested Format ID (ex: Onshape-Demo/QA)

Then in the Dev Portal create a new Store Entry for the Oauth Application you just created.

Onshape will register the app on Partner server and send back the OAUTH ID/Secret which are required for authentication.

Make changes to code in one place for the new URL that Heroku has produced, as shown below:

    file# 1: ./package.json
       
       ......... 
       ........
       "repository": {
       "type": "git",
       "url": "https://newURL-from-heroku.herokuapp.com/"
       },
       ...........

Push the local repo code along with code changes to heruko

    $ git add package.json
    $ git add authentication.js
    $ git commit -am "changes to code for callbackURL"
    
    $ git push heroku master

You will need to set the ID and Secret as environment variables on the server. These are only visible to the app running
on the server preserving security of that information.

    $ heroku config:set OAUTH_CLIENT_ID=<ID given by Onshape for this app>
    $ heroku config:set OAUTH_CLIENT_SECRET=<Secret given by Onshape for this app>

You will also need to register your server host, and the stack url
(for example ONSHAPE_PLATFORM=https://staging.dev.onshape.com)

    $ heroku config:set ONSHAPE_HOST=https://newURL-from-heroku.herokuapp.com
    $ heroku config:set ONSHAPE_PLATFORM=https://STACK.onshape.com

You can verify that they are set by calling this:

    $ heroku config

One more step before you can use this app sample with Onshape. It requires RedisTOGO. 

    $ heroku addons:create redistogo

If you are new to Heroku, it may complain the first time you do this for an app requiring you to add credit card info
as a payment source for potential server traffic. Don't worry, you can select the level of service for RedisTOGO and
the base level is free (no cost). The payment source is required in case the service is scaled up to handle a large
number of users. You do this via www.heroku.com.

Use heroku config again to verify that RedisTOGO is setup. You'll see this in the config.

    REDISTOGO_URL:        redis://redistogo:bb0854dd586250250969a8b0ea4aa695@hammerjaw.redistogo.com:11093/
    


#####**Reference Documentation**
######***Heroku***
For more information about using Node.js on Heroku, see these Dev Center articles:

 -  [Getting Started with Node.js on Heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs)
 -  [Node.js on Heroku](https://devcenter.heroku.com/categories/nodejs)
 -  [Best Practices for Node.js Development](https://devcenter.heroku.com/articles/node-best-practices)
 
######***OAuth***
Onshape uses standard OAuth2. 
 - [See the RFC for a detailed description of OAuth](https://tools.ietf.org/html/rfc6749)
 - [Digital Ocean provides a nice tutorial on using OAuth](https://www.digitalocean.com/community/tutorials/an-introduction-to-oauth-2)
