package config

import (
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

type Config struct {
	APIBaseURL    string `json:"api_base_url"`
	BindAddr      string `json:"bind_addr"`
	Port          int    `json:"port"`
	PrometheusURL string `json:"prometheus_url"`
	GrafanaURL    string `json:"grafana_url"`
}

func Default() Config {
	return Config{
		APIBaseURL:    "http://127.0.0.1:7777",
		BindAddr:      "127.0.0.1",
		Port:          8080,
		PrometheusURL: "http://127.0.0.1:9090",
		GrafanaURL:    "http://127.0.0.1:3000",
	}
}

func Path() string {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return filepath.Join(os.Getenv("HOME"), ".config", "concave-web", "config.toml")
	}
	return filepath.Join(configDir, "concave-web", "config.toml")
}

func Load() (Config, error) {
	cfg := Default()
	path := Path()
	data, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		if err := Save(cfg); err != nil {
			return Config{}, err
		}
		return cfg, nil
	}
	if err != nil {
		return Config{}, fmt.Errorf("read %s: %w", path, err)
	}
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		key, raw, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		key = strings.TrimSpace(key)
		value := strings.Trim(strings.TrimSpace(raw), `"'`)
		switch key {
		case "api_base_url":
			cfg.APIBaseURL = value
		case "bind_addr":
			cfg.BindAddr = value
		case "port":
			port, err := strconv.Atoi(value)
			if err != nil {
				return Config{}, fmt.Errorf("invalid port %q", value)
			}
			cfg.Port = port
		case "prometheus_url":
			cfg.PrometheusURL = value
		case "grafana_url":
			cfg.GrafanaURL = value
		}
	}
	return cfg, nil
}

func Save(cfg Config) error {
	path := Path()
	if err := os.MkdirAll(filepath.Dir(path), 0o700); err != nil {
		return fmt.Errorf("mkdir %s: %w", filepath.Dir(path), err)
	}
	var buf bytes.Buffer
	fmt.Fprintf(&buf, "api_base_url = %q\n", cfg.APIBaseURL)
	fmt.Fprintf(&buf, "bind_addr = %q\n", cfg.BindAddr)
	fmt.Fprintf(&buf, "port = %d\n", cfg.Port)
	fmt.Fprintf(&buf, "prometheus_url = %q\n", cfg.PrometheusURL)
	fmt.Fprintf(&buf, "grafana_url = %q\n", cfg.GrafanaURL)
	tmp := path + ".tmp"
	if err := os.WriteFile(tmp, buf.Bytes(), 0o600); err != nil {
		return fmt.Errorf("write %s: %w", tmp, err)
	}
	if err := os.Rename(tmp, path); err != nil {
		return fmt.Errorf("rename %s: %w", path, err)
	}
	return nil
}
