package proxy

import (
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestProxyForwardsRequest(t *testing.T) {
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/api/v1/health" {
			t.Fatalf("path = %s, want /api/v1/health", r.URL.Path)
		}
		if cookie := r.Header.Get("Cookie"); cookie != "concave_session=test-token" {
			t.Fatalf("cookie = %q, want session cookie", cookie)
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"status":"ok"}`)
	}))
	defer backend.Close()

	handler, err := New(backend.URL)
	if err != nil {
		t.Fatalf("New() error = %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/v1/health", nil)
	req.Header.Set("Cookie", "concave_session=test-token")
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rr.Code)
	}
	if body := rr.Body.String(); body != `{"status":"ok"}` {
		t.Fatalf("body = %q, want backend payload", body)
	}
}

func TestNewPathStripsPrefixBeforeForwarding(t *testing.T) {
	var seenPath, seenQuery string
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seenPath = r.URL.Path
		seenQuery = r.URL.RawQuery
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"status":"success","data":{"result":[]}}`)
	}))
	defer backend.Close()

	handler, err := NewPath(backend.URL, "/monitoring/prometheus")
	if err != nil {
		t.Fatalf("NewPath() error = %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/monitoring/prometheus/api/v1/query?query=up", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rr.Code)
	}
	if seenPath != "/api/v1/query" {
		t.Fatalf("upstream path = %q, want /api/v1/query", seenPath)
	}
	if seenQuery != "query=up" {
		t.Fatalf("upstream query = %q, want query=up", seenQuery)
	}
}

func TestNewPathRootRequest(t *testing.T) {
	var seenPath string
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seenPath = r.URL.Path
		w.WriteHeader(http.StatusOK)
	}))
	defer backend.Close()

	handler, err := NewPath(backend.URL, "/monitoring/grafana")
	if err != nil {
		t.Fatalf("NewPath() error = %v", err)
	}

	req := httptest.NewRequest(http.MethodGet, "/monitoring/grafana/", nil)
	rr := httptest.NewRecorder()
	handler.ServeHTTP(rr, req)

	if seenPath != "/" {
		t.Fatalf("upstream path = %q, want /", seenPath)
	}
}

func TestNewPathRejectsInvalidTarget(t *testing.T) {
	if _, err := NewPath("://bad-url", "/monitoring/prometheus"); err == nil {
		t.Fatal("NewPath() expected error for invalid target, got nil")
	}
}
