---
layout: search
title: Busqueda dentro del sitio
---

<form action="/search" method="get">
  <label for="search-box">Ingresa alguna palabra clave</label>
  <input type="text" id="search-box" name="query">
  <input type="submit" value="buscar">
</form>

<div class="search-results">
    <h3>Search Results</h3>
    <ul id="search-results"></ul>
</div>


<script>
  window.store = {
    {% for page in site.pages %}
      "{{ page.url | slugify }}": {
        "title": "{{ page.title | xml_escape }}",
        "content": {{ page.content | strip_html | strip_newlines | jsonify }},
        "url": "{{ page.url | xml_escape }}"
      }
      {% unless forloop.last %},{% endunless %}
    {% endfor %}
  };
</script>
