// ==UserScript==
// @name        reddit: Allow use of cloudsearch syntax
// @author      Sophie Hamilton (/u/Sophira)
// @description Adds a checkbox to allow the use of cloudsearch syntax with the reddit search widget, and provides a link to /u/interiot's cloudsearch syntax page.
// @namespace   http://theblob.org/
// @include     http://reddit.com/*
// @include     https://reddit.com/*
// @include     http://*.reddit.com/*
// @include     https://*.reddit.com/*
// @version     2
// @grant       none
// ==/UserScript==





/*
   Query string decoder object obtained from:
     <http://unixpapa.com/js/querystring.html>

   I, Sophie Hamilton, claim no copyright over it. It is reproduced here with
   the permission of the creator:

   'As with all the code on these "Javascript Madness" pages, you may use this
    freely in any way without worrying about my copyright at all, and, as
    usual, it is offered without warrantee.' [sic]
*/

// Query String Parser
//
//    qs= new QueryString()
//    qs= new QueryString(string)
//
//        Create a query string object based on the given query string. If
//        no string is given, we use the one from the current page by default.
//
//    qs.value(key)
//
//        Return a value for the named key.  If the key was not defined,
//        it will return undefined. If the key was multiply defined it will
//        return the last value set. If it was defined without a value, it
//        will return an empty string.
//
//   qs.values(key)
//
//        Return an array of values for the named key. If the key was not
//        defined, an empty array will be returned. If the key was multiply
//        defined, the values will be given in the order they appeared on
//        in the query string.
//
//   qs.keys()
//
//        Return an array of unique keys in the query string.  The order will
//        not necessarily be the same as in the original query, and repeated
//        keys will only be listed once.
//
//    QueryString.decode(string)
//
//        This static method is an error tolerant version of the builtin
//        function decodeURIComponent(), modified to also change pluses into
//        spaces, so that it is suitable for query string decoding. You
//        shouldn't usually need to call this yourself as the value(),
//        values(), and keys() methods already decode everything they return.
//
// Note: W3C recommends that ; be accepted as an alternative to & for
// separating query string fields. To support that, simply insert a semicolon
// immediately after each ampersand in the regular expression in the first
// function below.

function QueryString(qs)
{
    this.dict= {};

    // If no query string  was passed in use the one from the current page
    if (!qs) qs= location.search;

    // Delete leading question mark, if there is one
    if (qs.charAt(0) == '?') qs= qs.substring(1);

    // Parse it
    var re= /([^=&]+)(=([^&]*))?/g;
    while (match= re.exec(qs))
    {
        var key= decodeURIComponent(match[1].replace(/\+/g,' '));
        var value= match[3] ? QueryString.decode(match[3]) : '';
        if (this.dict[key])
            this.dict[key].push(value);
        else
            this.dict[key]= [value];
    }
}

QueryString.decode= function(s)
{
    s= s.replace(/\+/g,' ');
    s= s.replace(/%([EF][0-9A-F])%([89AB][0-9A-F])%([89AB][0-9A-F])/gi,
        function(code,hex1,hex2,hex3)
        {
            var n1= parseInt(hex1,16)-0xE0;
            var n2= parseInt(hex2,16)-0x80;
            if (n1 == 0 && n2 < 32) return code;
            var n3= parseInt(hex3,16)-0x80;
            var n= (n1<<12) + (n2<<6) + n3;
            if (n > 0xFFFF) return code;
            return String.fromCharCode(n);
        });
    s= s.replace(/%([CD][0-9A-F])%([89AB][0-9A-F])/gi,
        function(code,hex1,hex2)
        {
            var n1= parseInt(hex1,16)-0xC0;
            if (n1 < 2) return code;
            var n2= parseInt(hex2,16)-0x80;
            return String.fromCharCode((n1<<6)+n2);
        });
    s= s.replace(/%([0-7][0-9A-F])/gi,
        function(code,hex)
        {
            return String.fromCharCode(parseInt(hex,16));
        });
    return s;
};

QueryString.prototype.value= function (key)
{
    var a= this.dict[key];
    return a ? a[a.length-1] : undefined;
};

QueryString.prototype.values= function (key)
{
    var a= this.dict[key];
    return a ? a : [];
};

QueryString.prototype.keys= function ()
{
    var a= [];
    for (var key in this.dict)
        a.push(key);
    return a;
};





(function() {
  // add the cloudsearch checkbox
  var restricts = document.querySelectorAll('form#search div#moresearchinfo');
  for (var i = 0; i < restricts.length; i++) {
    var checked="false";
    var qs = new QueryString();
    var cs = qs.value("syntax");
    if (cs == "cloudsearch") {
      checked = " checked";
    }

    var div = document.createElement("div");
    div.innerHTML = '<label><input name="syntax" value="cloudsearch" type="checkbox"' + checked + '>use cloudsearch syntax</label> (<a href="https://cdn.rawgit.com/DeeNewcum/reddit/master/cloudsearch/cloudsearch_reference.html">help</a>)';   // thanks to /u/interiot for the wonderful page on cloudsearch syntax!
    var info = restricts.item(i);
    var parent = info.parentNode;
    parent.insertBefore(div, info);

    // because some of the #moresearchinfo styles only trigger if there's a LABEL directly before it, we need to add those back manually. Hax :(
    // in the case of the search not being on the sidebar, we also need to check to see if any BRs need to be added for layout purposes.
    info.style.borderTopWidth = "1px";
    if (parent.id == "searchexpando") {   // sidebar
      info.style.marginTop = "0px";
    }
    else {
      var br = document.querySelector("form#search br");
      if (!br) {
        // add a couple
        parent.insertBefore(document.createElement("br"), div);
        parent.insertBefore(document.createElement("br"), div);
      }
    }

    // we also need to fix the tabindex
    var form = parent;
    if (parent.id == "searchexpando") { form = parent.parentNode; }   // sidebar

    var el;
    el = form.querySelector('input[name="restrict_sr"]');
    if (!el) { el = parent.querySelector('input[name="q"]'); }
    if (el) {
      var tabnum = parseInt(el.tabIndex);

      var tabbedelements = document.querySelectorAll("*[tabindex]");
      for (var j = 0; j < tabbedelements.length; j++) {
        var tabbedel = tabbedelements.item(j);
        if (tabbedel.tabIndex > tabnum) { tabbedel.tabIndex++; }
      }

      div.querySelector("input").tabIndex = tabnum + 1;
    }
  }

  // The error message:
  //    I couldn't understand your query, so I simplified it and ...
  // is misleading.  Replace it with something more clear.
  var errormsg = document.querySelector("div.infobar div.md > p");
  if (errormsg && cs == "cloudsearch") {
    var results = errormsg.innerHTML.match(/^I couldn't understand your query, so I simplified it and searched for "(.*)" instead\./);
    if (results) {
      errormsg.innerHTML = 'Cloudsearch syntax error. (<a href="https://cdn.rawgit.com/DeeNewcum/reddit/master/cloudsearch/cloudsearch_reference.html">Need help?</a>) The non-Cloudsearch search results for "' + results[1] + '" are below, but that\'s probably not what you wanted.';
    }
  }
})();
