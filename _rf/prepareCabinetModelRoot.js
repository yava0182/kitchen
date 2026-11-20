function prepareCabinetModelRoot(tpl, mergedSpec, entry, sizeMm, prepOpts) {
    const THREE = getThree();
    if (!THREE) return tpl;
    const root = tpl.clone(true);
    const modelId = String(mergedSpec?.id ?? mergedSpec?.key ?? '').trim();
    // #7 — корпусные направляющие, не петля; hingeLike только 5/6 (чашка/корпус петли).
    const hingeLike = modelId === '5' || modelId === '6';
    const guideLike =
      modelId === '7' ||
      modelId === '8' ||
      modelId === '9' ||
      modelId === '10' ||
      /направляющ|направл|guide|runner|telescop/i.test(
        String(mergedSpec?.key || mergedSpec?.name || ''),
      );
    const handleLike = modelId === '3';
    const jointHardware =
      Number(mergedSpec?.joint_hardware) === 1 ||
      mergedSpec?.jointHardware === true ||
      mergedSpec?.skipCatalogRotation === true ||
      Number(mergedSpec?.fromJointScheme) === 1 ||
      mergedSpec?.fromJointScheme === true;
    const jointTemplateModel =
      Number(mergedSpec?.joint_template_model) === 1 ||
      mergedSpec?.jointTemplateModel === true;
    const sizeMmLooksEmpty =
      !(Number(sizeMm?.x) > 0.5) &&
      !(Number(sizeMm?.y) > 0.5) &&
      !(Number(sizeMm?.z) > 0.5);
    // size 0 + slot_fit/vertex sizing → scale ~1e-6 и крепёж «пропадает» в комнате.
    const keepNativeJointScale =
      jointTemplateModel || jointHardware || (mergedSpec?.fitToSize === false && sizeMmLooksEmpty);
    root.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        o.userData.isAccessory = true;
        if (jointTemplateModel || jointHardware) {
          o.userData.fromJointScheme = 1;
          o.userData.jointHardwareMesh = true;
          o.userData.joint_hardware = 1;
          if (jointTemplateModel) o.userData.jointTemplateModel = 1;
        }
        if (hingeLike) {
          o.userData.cldSkipStep5FacadeDecor = true;
          o.userData.isHingeCabinetModelMetal = true;
          o.userData.cldHingeCatalogModel = true;
        }
        if (guideLike) o.userData.cldGuideCabinetModel = true;
      }
      if (o.isMesh || o.isGroup) {
        if (hingeLike) o.userData.cldSkipStep5FacadeDecor = true;
        if (guideLike) o.userData.cldGuideCabinetModel = true;
      }
    });
    root.userData = root.userData || {};
    if (modelId) root.userData.modelSpecId = modelId;
    if (jointTemplateModel || jointHardware) {
      root.userData.fromJointScheme = 1;
      root.userData.jointHardwareMesh = true;
      root.userData.isAccessory = true;
    }
    if (hingeLike) root.userData.cldSkipStep5FacadeDecor = true;
    if (guideLike) root.userData.cldGuideCabinetModel = true;
    const refMm =
      readPositiveRefMm(mergedSpec.preview_ref_mm) ||
      readPositiveRefMm(mergedSpec.ref_size_mm) ||
      readPositiveRefMm(entry?.preview_ref_mm) ||
      null;
    const fitToSize =
      mergedSpec.fitToSize === true ||
      mergedSpec.fit_to_size === 1 ||
      (mergedSpec.resizable && Number(mergedSpec.resizable.enabled) === 1);
    const roomHandle =
      mergedSpec.roomHandle === true ||
      mergedSpec.room_handle === true;
    root.scale.set(1, 1, 1);
    root.position.set(0, 0, 0);
    root.rotation.set(0, 0, 0);
    root.updateMatrixWorld(true);

    if (handleLike && fitToSize && !roomHandle) {
      const impH = inferFileToMmScaleFromMeshes(root, mergedSpec);
      root.scale.setScalar(impH);
      root.updateMatrixWorld(true);
      storeCatalogEntryRotation(root, entry);
      // sizeMm = width/height/depth из cabinet_model (как у опоры в buildModel).
      scaleHandleVolnaToPrepMm(root, cardSizeMmForHandlePrep(entry, sizeMm));
      root.userData._cldHandleScalePrepared = true;
      root.userData._cldCatalogRotApplied = true;
      return root;
    }

    const entryParams = entry?.params && typeof entry.params === 'object' ? entry.params : {};
    const meshMap = entryParams.meshes || null;
    // slot_fit из админки (модель целиком) — приоритет над дефолтным t.y=1 у меша в JSON
    const useWholeSlotFit = slotFitHasRules(readSlotFit(entryParams));
    const useMeshVertexSizing = !useWholeSlotFit && meshMapHasSizeRules(meshMap);

    const imp = inferFileToMmScale(root, mergedSpec);
    root.scale.setScalar(imp);
    root.updateMatrixWorld(true);

    if (jointTemplateModel) {
      // Базис / шаблон присадки: ориентация и scale — только из карточки 3D
      // (params.rot / pos / scale). Не центрируем и не подгоняем по size.
      applyCatalogEntryTransform(root, entry);
      // Петли-половины #5/#6: без auto minX / rotateY(180) (СК карточки 3D).
      // Корпус L-пакета (#27 и др.) — тот же prepare, что drill-preview админки
      // (align minX), иначе origin по X расходится между шаблоном и карточкой.
      const isHingeHalf = modelId === '5' || modelId === '6';
      if (!isHingeHalf) {
        alignJointTemplateModelOriginToMinX(root, {
          isEccentric: isEccentricJointTemplateModel(modelId, entry, mergedSpec),
        });
      } else {
        root.userData = root.userData || {};
        root.userData._cldJointTemplateOriginMode = 'catalog_card';
      }
      return root;
    }

    if (keepNativeJointScale) {
      // Стыковой крепёж / size=0: нативный GLB (как админ). Не slot_fit и не fit-to-1mm.
      centerOnlyKeepScale(root);
      return root;
    }

    if (useMeshVertexSizing) {
      bakeMeshesToRootLocal(root);
      root.scale.set(1, 1, 1);
      root.position.set(0, 0, 0);
      root.updateMatrixWorld(true);
      applyCabinetModelMeshVertexSizing(root, entryParams, resolveSlotTargetSizeMm(sizeMm, refMm));
      if (!roomHandle && !jointHardware) {
        storeCatalogEntryRotation(root, entry);
      }
      return root;
    }

    if (useWholeSlotFit) {
      if (!roomHandle) {
        const catSc = catalogScaleVec(entry);
        if (catSc && (catSc.x !== 1 || catSc.y !== 1 || catSc.z !== 1)) {
          root.scale.multiply(new THREE.Vector3(catSc.x, catSc.y, catSc.z));
          root.updateMatrixWorld(true);
        }
      }
      applyWholeObjectSlotFit(root, entryParams, resolveSlotTargetSizeMm(sizeMm, refMm));
      if (!roomHandle && !jointHardware) {
        storeCatalogEntryRotation(root, entry);
      }
      return root;
    }

    if (jointHardware) {
      // Крепёж стыка: без catalog rot.y=90; ось задаёт furniture rot.z в дереве.
      centerOnlyKeepScale(root);
      return root;
    }

    const hangFromTop =
      mergedSpec?.isRodCompanion === true && mergedSpec?.rodHangFromTop === true;
    if (mergedSpec?.rodHangStrip === true) root.userData.rodHangStrip = true;
    if (refMm) {
      if (hangFromTop) scaleAndHangFromTopMm(root, refMm);
      else scaleAndCenterToRefMm(root, refMm);
    } else if (fitToSize && roomHandle) {
      const imp = inferFileToMmScale(root, mergedSpec);
      if (imp !== 1) {
        root.scale.multiplyScalar(imp);
        root.updateMatrixWorld(true);
      }
      centerOnlyKeepScale(root);
    } else if (fitToSize) {
      if (hangFromTop) scaleAndHangFromTopMm(root, sizeMm);
      else scaleAndCenterToRefMm(root, sizeMm);
    } else if (hangFromTop) {
      // Без ref: только сдвиг — верх крючка в y=0.
      root.updateMatrixWorld(true);
      const boxHang = new THREE.Box3().setFromObject(root);
      if (!boxHang.isEmpty()) {
        const cHang = boxHang.getCenter(new THREE.Vector3());
        root.position.set(-cHang.x, -boxHang.max.y, -cHang.z);
      }
    } else {
      centerOnlyKeepScale(root);
    }
    if (mergedSpec?.rodHangStrip === true) {
      const usable = Number(mergedSpec.rodHangStripUsableMm) || 0;
      const maxH = Number(mergedSpec.rodHangStripMaxHang) || 0;
      if (usable > 0) clipHangStripToRodRealSizeMm(root, usable, THREE, maxH);
    }
    if (!roomHandle) {
      const catSc = catalogScaleVec(entry);
      if (catSc && (catSc.x !== 1 || catSc.y !== 1 || catSc.z !== 1)) {
        root.scale.multiply(new THREE.Vector3(catSc.x, catSc.y, catSc.z));
        root.updateMatrixWorld(true);
        centerOnlyKeepScale(root);
      }
      storeCatalogEntryRotation(root, entry);
    }
    // guideLike + alignRootToSizePivotFaceX убраны: ломали CAD-посадку направляющих.
    return root;
  }