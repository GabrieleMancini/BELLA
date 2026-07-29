import sys

path = "index.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old = """var IMG_EXT = ['jpg','jpeg','png','webp'];

fetch('https://api.github.com/repos/' + GITHUB_USER + '/' + GITHUB_REPO + '/git/trees/' + GITHUB_BRANCH + '?recursive=1')
  .then(function(r) { return r.ok ? r.json() : Promise.reject(); })
  .then(function(data) {
    var tree = data.tree || [];
    document.querySelectorAll('.event-folder[data-folder]').forEach(function(card) {
      var folder = card.getAttribute('data-folder').toLowerCase() + '/';
      var imgs = tree.filter(function(n) {
        return n.path.toLowerCase().indexOf(folder) === 0 && IMG_EXT.indexOf(n.path.split('.').pop().toLowerCase()) > -1;
      });
      if (imgs.length) {
        card.querySelector('.badge-count').textContent = imgs.length + ' photos';
      }
    });
  })
  .catch(function() { /* Gracefully falls back to 'Archive' if API rate limits */ });"""

new = """var IMG_EXT = ['jpg','jpeg','png','webp','gif','heic','avif'];
var VIDEO_EXT = ['mp4','mov','webm','m4v'];

fetch('https://api.github.com/repos/' + GITHUB_USER + '/' + GITHUB_REPO + '/git/trees/' + GITHUB_BRANCH + '?recursive=1')
  .then(function(r) { return r.ok ? r.json() : Promise.reject(); })
  .then(function(data) {
    var tree = data.tree || [];
    document.querySelectorAll('.event-folder[data-folder]').forEach(function(card) {
      var folder = card.getAttribute('data-folder').toLowerCase() + '/';
      var imgs = tree.filter(function(n) {
        return n.path.toLowerCase().indexOf(folder) === 0 && IMG_EXT.indexOf(n.path.split('.').pop().toLowerCase()) > -1;
      });
      var vids = tree.filter(function(n) {
        return n.path.toLowerCase().indexOf(folder) === 0 && VIDEO_EXT.indexOf(n.path.split('.').pop().toLowerCase()) > -1;
      });
      var parts = [];
      if (imgs.length) parts.push(imgs.length + ' photo' + (imgs.length !== 1 ? 's' : ''));
      if (vids.length) parts.push(vids.length + ' video' + (vids.length !== 1 ? 's' : ''));
      if (parts.length) {
        card.querySelector('.badge-count').textContent = parts.join(' \\u00b7 ');
      }
    });
  })
  .catch(function() { /* Gracefully falls back to 'Archive' if API rate limits */ });"""

if old not in content:
    print("PATTERN NOT FOUND -- aborting, no changes made")
    sys.exit(1)

content = content.replace(old, new)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("index.html badge script updated successfully")
