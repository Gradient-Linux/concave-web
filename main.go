package main

import (
	"embed"
	"errors"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"os"

	"github.com/Gradient-Linux/concave-web/internal/config"
	"github.com/Gradient-Linux/concave-web/internal/proxy"
)

//go:embed all:frontend/dist
var frontend embed.FS

var version = "dev"

func main() {
	if err := run(os.Args[1:]); err != nil {
		fmt.Fprintln(os.Stderr, err.Error())
		os.Exit(1)
	}
}

func run(args []string) error {
	switch len(args) {
	case 0:
		return serve()
	case 1:
		switch args[0] {
		case "serve":
			return serve()
		case "--help", "-h":
			printHelp()
			return nil
		case "--version":
			fmt.Println(version)
			return nil
		default:
			return fmt.Errorf("unknown command %q", args[0])
		}
	default:
		return errors.New("usage: concave-web [serve|--help|--version]")
	}
}

func serve() error {
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	apiProxy, err := proxy.New(cfg.APIBaseURL)
	if err != nil {
		return err
	}

	dist, err := fs.Sub(frontend, "frontend/dist")
	if err != nil {
		return err
	}

	mux := http.NewServeMux()
	spa := spaHandler(dist)

	mux.Handle("/api/v1/", apiProxy)

	if cfg.PrometheusURL != "" {
		promProxy, err := proxy.NewPath(cfg.PrometheusURL, "/monitoring/prometheus")
		if err != nil {
			return fmt.Errorf("prometheus proxy: %w", err)
		}
		mux.Handle("/monitoring/prometheus/", promProxy)
	}
	if cfg.GrafanaURL != "" {
		grafProxy, err := proxy.NewPath(cfg.GrafanaURL, "/monitoring/grafana")
		if err != nil {
			return fmt.Errorf("grafana proxy: %w", err)
		}
		mux.Handle("/monitoring/grafana/", grafProxy)
	}

	mux.HandleFunc("/settings", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet && wantsHTML(r) {
			spa.ServeHTTP(w, r)
			return
		}
		handleSettings(w, r)
	})
	mux.Handle("/", spa)

	addr := fmt.Sprintf("%s:%d", cfg.BindAddr, cfg.Port)
	log.Printf("concave-web listening on http://%s", addr)
	return http.ListenAndServe(addr, mux)
}

func printHelp() {
	fmt.Println("Usage: concave-web [serve|--help|--version]")
	fmt.Println()
	fmt.Println("Serve the browser control plane for concave.")
}
