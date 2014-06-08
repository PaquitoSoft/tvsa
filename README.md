TVSA
====
This repo holds the code for a tv-show info website.

The first code has been written following this awesome tutorial: [Create a TV Show Tracker using AngularJS, Node.js and MongoDB]() by [Sahat Yalkabov](http://sahatyalkabov.com/) 

TODO
====
* Organize client-side code
* Refactor server-side code
* Write tests for current code (server and client)
* Add code coverage (gulp-coverage)
* Do not store whole user in cookies (Explore token-based authentication)
* Change the way tv-shows are added to database
* Change relationship between show and user (a user must have shows, not the other way)
* Integrate with tvshows statistics graphs
* Use some typeahead plugin for searching tvshows functionality
* Show episodes rating
* Show ratings votes counter
* Ignore episodes with seasonNumber === 0???
* HTML mails (use templates)
* Third party authentication
* Recover password process? (disable local app auth?)

* User profile page with a list of subscribed shows
* Dynamically update page <title> on each route
* Create a personalized calendar view with subscribed shows
* Create a calendar view that displays every show (time, date, network, episode overview)
* Display a show’s episodes in Bootstrap Tabs, grouped by seasons
* Text message notifications
* Customizable alert time (2 hours in advance, 1 day in advance, etc.)
* Add an admin role; only admins can add new TV shows
* Display Twitter feed for each TV show
* Create an AngularJS service for fetching and displaying latest news and gossip about a TV show
* Resize thumbnails via sharp and optimize via gulp-imagemin then upload to Amazon S3
* Add Redis database as a caching layer
* Explore token-based authentication
