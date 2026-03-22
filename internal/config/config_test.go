package config

import (
	"os"
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
	if _, err := os.Stat(Path()); err != nil {
		t.Fatalf("Stat(%s) error = %v", Path(), err)
	}
}

func TestSaveRoundTrip(t *testing.T) {
	t.Setenv("XDG_CONFIG_HOME", t.TempDir())

	want := Config{
		APIBaseURL: "http://127.0.0.1:9999",
		BindAddr:   "0.0.0.0",
		Port:       9090,
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
