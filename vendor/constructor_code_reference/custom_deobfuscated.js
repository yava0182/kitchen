custom_settings.room_sizes = {
  width: 4500,
  height: 2700,
  depth: 4000
}

CFRN_CONV = new CFRN()

function extoprt_to_Bazis() {
  CFRN_CONV.disable_remote_flag = 0
  CFRN_CONV.exportAndDownloadCFRNResult()
}
