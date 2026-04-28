package config

import (
	"encoding/json"
	"os"
	"strings"
	"testing"
)

func TestLoadWritesDefaultsWhenMissing(t *testing.T) {
	t.Setenv("XDG_CONFIG_HOME", t.TempDir())

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if cfg.APIBaseURL != "http://127.0.0.1:7777" || cfg.BindAddr != "127.0.0.1" || cfg.Port != 8080 {
		t.Fatalf("Load() = %#v, want defaults", cfg)
	}
	if cfg.PrometheusURL != "http://127.0.0.1:9090" {
		t.Fatalf("Load() prometheus = %q, want default", cfg.PrometheusURL)
	}
	if cfg.GrafanaURL != "http://127.0.0.1:3000" {
		t.Fatalf("Load() grafana = %q, want default", cfg.GrafanaURL)
	}
	if _, err := os.Stat(Path()); err != nil {
		t.Fatalf("Stat(%s) error = %v", Path(), err)
	}
}

func TestSaveRoundTrip(t *testing.T) {
	t.Setenv("XDG_CONFIG_HOME", t.TempDir())

	want := Config{
		APIBaseURL:    "http://127.0.0.1:9999",
		BindAddr:      "0.0.0.0",
		Port:          9090,
		PrometheusURL: "http://127.0.0.1:19090",
		GrafanaURL:    "http://127.0.0.1:13000",
	}
	if err := Save(want); err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	got, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if got != want {
		t.Fatalf("Load() = %#v, want %#v", got, want)
	}
}

func TestSaveOptionalMonitoringURLsMayBeEmpty(t *testing.T) {
	t.Setenv("XDG_CONFIG_HOME", t.TempDir())

	want := Config{
		APIBaseURL:    "http://127.0.0.1:7777",
		BindAddr:      "127.0.0.1",
		Port:          8080,
		PrometheusURL: "",
		GrafanaURL:    "",
	}
	if err := Save(want); err != nil {
		t.Fatalf("Save() error = %v", err)
	}
	got, err := Load()
	if err != nil {
		t.Fatalf("Load() error = %v", err)
	}
	if got != want {
		t.Fatalf("Load() = %#v, want %#v", got, want)
	}
}

func TestJSONMarshalUsesSnakeCase(t *testing.T) {
	cfg := Config{
		APIBaseURL:    "http://127.0.0.1:7777",
		BindAddr:      "127.0.0.1",
		Port:          8080,
		PrometheusURL: "http://127.0.0.1:9090",
		GrafanaURL:    "http://127.0.0.1:3000",
	}
	raw, err := json.Marshal(cfg)
	if err != nil {
		t.Fatalf("Marshal() error = %v", err)
	}
	expected := []string{
		`"api_base_url"`,
		`"bind_addr"`,
		`"port"`,
		`"prometheus_url"`,
		`"grafana_url"`,
	}
	body := string(raw)
	for _, key := range expected {
		if !strings.Contains(body, key) {
			t.Fatalf("Marshal() = %s, want key %s", body, key)
		}
	}
}
