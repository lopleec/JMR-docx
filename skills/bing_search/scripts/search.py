#!/usr/bin/env python3
"""Bing Search Skill"""
import sys
import os
import re
import json
import ssl
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET


def _build_opener(proxy=None):
    proxy_handler = urllib.request.ProxyHandler({"http": proxy, "https": proxy}) if proxy else urllib.request.ProxyHandler()
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return urllib.request.build_opener(proxy_handler, urllib.request.HTTPSHandler(context=ctx))


def _fetch(opener, url, timeout=15):
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
        },
    )
    with opener.open(req, timeout=timeout) as resp:
        return resp.read()


def _search_bing_rss(opener, query, num_results):
    rss_url = (
        f"https://www.bing.com/search?q={urllib.parse.quote(query)}"
        "&format=rss&setlang=en-us&cc=US"
    )
    raw = _fetch(opener, rss_url)
    root = ET.fromstring(raw)
    items = root.findall("./channel/item")

    out = []
    seen = set()
    for item in items:
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        snippet = (item.findtext("description") or "").strip()
        if not link or link in seen:
            continue
        seen.add(link)
        out.append({"title": title, "url": link, "snippet": snippet})
        if len(out) >= num_results:
            break
    return out


def _search_bing_html_fallback(opener, query, num_results):
    url = f"https://www.bing.com/search?q={urllib.parse.quote(query)}"
    html = _fetch(opener, url).decode("utf-8", errors="ignore")

    # Primary pattern: search result links in <li class="b_algo"> ... <a href="...">
    candidates = re.findall(r'<li[^>]*class="[^"]*b_algo[^"]*"[\s\S]*?<a\s+href="(https?://[^"]+)"', html)
    if not candidates:
        # Broad fallback: any direct http(s) href in page
        candidates = re.findall(r'href="(https?://[^"]+)"', html)

    out = []
    seen = set()
    for link in candidates:
        if link in seen:
            continue
        if any(x in link for x in ["bing.com", "microsoft.com", "r.bing.com"]):
            continue
        seen.add(link)
        out.append({"title": "", "url": link, "snippet": ""})
        if len(out) >= num_results:
            break
    return out


def search_bing(query, proxy=None, num_results=10):
    opener = _build_opener(proxy)
    try:
        results = _search_bing_rss(opener, query, num_results)
        if not results:
            results = _search_bing_html_fallback(opener, query, num_results)
        return {"status": "success", "results": results}
    except Exception as e:
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python search.py <query>")
        sys.exit(1)
    query = " ".join(sys.argv[1:]).strip()
    proxy = os.environ.get("ALL_PROXY") or os.environ.get("HTTP_PROXY")
    print(json.dumps(search_bing(query, proxy), indent=2, ensure_ascii=False))
