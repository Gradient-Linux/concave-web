package proxy

import (
	"net/http"
	"net/http/httputil"
	"net/url"
)

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
