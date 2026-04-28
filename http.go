package main

import (
	"encoding/json"
	"io/fs"
	"net/http"
	"path"
	"strings"

	"github.com/Gradient-Linux/concave-web/internal/config"
)

func handleSettings(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		cfg, err := config.Load()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, cfg)
	case http.MethodPost:
		var cfg config.Config
		if err := json.NewDecoder(r.Body).Decode(&cfg); err != nil {
			http.Error(w, "invalid request body", http.StatusBadRequest)
			return
		}
		if cfg.APIBaseURL == "" || cfg.BindAddr == "" || cfg.Port <= 0 {
			http.Error(w, "api_base_url, bind_addr, and port are required", http.StatusBadRequest)
			return
		}
		// Prometheus and Grafana URLs are optional. When empty, the associated
		// /monitoring/* proxy route is simply not mounted on the next start.
		if err := config.Save(cfg); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, cfg)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func spaHandler(dist fs.FS) http.Handler {
	fileServer := http.FileServer(http.FS(dist))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(path.Clean(r.URL.Path), "/")
		if name == "." || name == "" {
			name = "index.html"
		}
		if _, err := fs.Stat(dist, name); err == nil {
			if strings.HasSuffix(name, ".html") {
				w.Header().Set("Cache-Control", "no-store, max-age=0")
			}
			fileServer.ServeHTTP(w, r)
			return
		}
		index, err := fs.ReadFile(dist, "index.html")
		if err != nil {
			http.Error(w, "frontend not built", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Cache-Control", "no-store, max-age=0")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(index)
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(value)
}

func wantsHTML(r *http.Request) bool {
	accept := r.Header.Get("Accept")
	return strings.Contains(accept, "text/html") || r.Header.Get("Sec-Fetch-Dest") == "document"
}
