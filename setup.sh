#!/usr/bin/env bash
set -o errexit
set -o nounset
set -o pipefail

readonly script_name=$(basename "${0}")
readonly script_dir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

usage() {
  echo "Setup database, run tests and then re-initialise database"
  echo
  echo "Usage:"
  echo "        -h    Print this usage info"
  echo "        -u    PostgreSQL username"
  echo "        -d    PostgreSQL database name"
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

while getopts ":hu:d:" option; do
  case $option in
    h)
      usage
      exit
      ;;
    u)
      PGUSERNAME=${OPTARG}
      ;;
    d)
      PGDBNAME=${OPTARG}
      ;;
    \?)
      echo "Error invalid option"
      usage
      exit 1
      ;;
  esac
done
shift $((OPTIND-1))

setupdb() {
  cmd="$( which psql )"
  if [[ -z cmd ]]; then
    echo "PostgreSQL (psql) not installed"
    exit 1
  fi

  cmd="$( psql -V | sed 's/.*\s//' )"
  if [[ ! $cmd =~ "14.4" ]]; then
    echo "PostgreSQL 14.4 required"
    exit 1
  fi

  cmd="$( systemctl status postgresql-14.service | grep -o 'running' )"
  if [[ ! $cmd =~ "running" ]]; then
    echo "PostgreSQL not running"
    exit 1
  fi

  echo "--- SETTING UP DATABASE ---"
  set -x
  psql -U postgres -c 'DROP DATABASE IF EXISTS ecommerce'
  psql -U postgres -c 'CREATE DATABASE ecommerce'
  psql -U "$PGUSERNAME" -d "$PGDBNAME" -f "${script_dir}/eCommerce.sql"
  { set +x; } 2>/dev/null
  echo "--- DATABASE INITIALISED ---"
}

tests() {
  echo "--- RUNNING UNIT TESTS ---"
  npm test
  echo "--- FINISHED TESTING ---"
}

main() {
  npm i
  setupdb
  echo
  tests
  echo
  setupdb
}

main
