package proxy

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
)

// New returns a reverse proxy that forwards requests to rawTarget verbatim.
// Cookies, SSE, and WebSocket upgrade headers are preserved by the default
// httputil.ReverseProxy behavior.
func New(rawTarget string) (http.Handler, error) {
	target, err := url.Parse(rawTarget)
	if err != nil {
		return nil, err
	}
	proxy := httputil.NewSingleHostReverseProxy(target)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		originalDirector(req)
		req.Host = target.Host
	}
	return proxy, nil
}

// NewPath returns a reverse proxy that strips stripPrefix from the incoming
// request path before forwarding to rawTarget. Useful for mounting an upstream
// service under a same-origin subpath (for example Prometheus at
// `/monitoring/prometheus/*`).
//
// A trailing slash in stripPrefix is optional. The remaining path is always
// forwarded with a leading slash so the upstream sees its own root correctly.
func NewPath(rawTarget, stripPrefix string) (http.Handler, error) {
	target, err := url.Parse(rawTarget)
	if err != nil {
		return nil, err
	}
	prefix := strings.TrimRight(stripPrefix, "/")
	proxy := httputil.NewSingleHostReverseProxy(target)
	originalDirector := proxy.Director
	proxy.Director = func(req *http.Request) {
		remainder := strings.TrimPrefix(req.URL.Path, prefix)
		if !strings.HasPrefix(remainder, "/") {
			remainder = "/" + remainder
		}
		req.URL.Path = remainder
		// RawPath carries the un-decoded path when set; keep it consistent so
		// percent-encoded characters in upstream URLs survive proxying.
		if req.URL.RawPath != "" {
			rawRemainder := strings.TrimPrefix(req.URL.RawPath, prefix)
			if !strings.HasPrefix(rawRemainder, "/") {
				rawRemainder = "/" + rawRemainder
			}
			req.URL.RawPath = rawRemainder
		}
		originalDirector(req)
		req.Host = target.Host
	}
	return proxy, nil
}
