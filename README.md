## Olivia's Pool

Multiple visualizations of average song gap for Phish shows from 1990 to early 2016. [Check it out](http://swingley.github.io/olivias-pool/).

### What That Mean 

In Phish parlence, a gap is the number of shows since a song was last played. If the gap is especially large i.e. [more than 100](http://forum.phish.net/forum/show/1342190725), it's a bustout. 

"Average song gap" is the average of all gaps for songs in a show. [Setlist pages on Phish.net](http://phish.net/setlists/?d=1999-07-26) show "average song gap" and the [gap chart page](http://phish.net/setlists/gapchart.php?d=1999-07-26) shows individual song gap info but, unless I'm an oblivious fool, there isn't anything that shows a table, chart or other kind of graph for multiple shows. 

Since I couldn't find anything that would show me average song gap for multiple shows, I decided to build something to do that.

## How

There is a [phish.net API](http://api.phish.net/) but it doesn't provide average song gap. As a result, I scraped show dates from phish.net by downloading each yearly setlist page e.g. [http://phish.net/setlists/1999.html](http://phish.net/setlists/1999.html) and pulling show dates out of those pages. Once I had all the dates, I made one request to the [gapchart](http://phish.net/setlists/gapchart.php?d=1999-07-26) page for each show, pulled the average song gap out of the response and saved it. Having a little empathy for phish.net servers, I waited one second between requests. As a result it took about half an hour to get all the gap info. (I now realize I could have gotten average song gap from each individual show page. It's the same info so this is a moot point. Still would have waited a second between requests.)

With average song gap numbers for every show, I could start visualizing it. The first attempt is what you see on the ["chart" tab](http://swingley.github.io/olivias-pool/). There's one bar chart per year. This was great for quickly spotting shows with big gaps. But I couldn't help but wonder... how would this look in a table? I did that next and you see it on the "table" tab. Finally, I thought a heat map might be useful so that's what you see on the "grid" tab.

## Nuts and Bolts

Data was scraped from phish.net with a couple of nodejs scripts. The table, charts and heat maps were built with [d3.js](http://d3js.org/). The grid or heat map section is a rip-off of [Mike Bostock's Calendar View example](http://bl.ocks.org/mbostock/4063318). [Material Design Lite](http://getmdl.io/) was used for the [layout](http://getmdl.io/components/index.html#layout-section/tabs),  [table](http://getmdl.io/components/index.html#tables-section) and to liven up the visual design.