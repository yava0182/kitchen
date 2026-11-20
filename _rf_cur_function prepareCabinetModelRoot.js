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
    const supportLegLike =
      mergedSpec?.cldSupportLeg === true ||
      /опора|support.?leg|opora/i.test(String(mergedSpec?.key || mergedSpec?.name || '')) ||
      modelId === '2' ||
      modelId === '79' ||
      modelId === '80';
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

    // Опоры: PlanPlace-own. Стыковой крепёж сюда не пускаем (native ниже).
    if (supportLegLike && !jointHardware && !jointTemplateModel) {
      const ppApi = global.__cldPlanPlaceLoadModel;
      if (ppApi && typeof ppApi.buildPlanPlaceOwnObject === 'function') {
        const own = ppApi.buildPlanPlaceOwnObject({
          tpl,
          entry,
          spec: mergedSpec,
          sizeMm,
          treeRotDeg: prepOpts?.treeRotDeg || prepOpts?.treeRot || {},
          pivot: prepOpts?.pivot || {},
          supportLeg: true,
        });
        if (own) {
          own.userData = own.userData || {};
          own.userData.cldSupportLeg = true;
          if (modelId) own.userData.modelSpecId = modelId;
          own.userData._cldSupportLegPrepared = true;
          return own;
        }
      }
      return prepareKitchenSupportLegRoot(root, mergedSpec, entry, sizeMm);
    }

    // Как «1.9 крепеж ок»: file→mm ДО jointTemplateModel.
    // Иначе эксцентрик (joint_template_model=1 + joint_hardware=1) уходит в return
    // без scale и остаётся в метрах → в Contours «пусто», видны только опоры.
    if (jointTemplateModel || jointHardware || keepNativeJointScale) {
      const impJoint = inferFileToMmScale(root, mergedSpec);
      root.scale.setScalar(impJoint);
      root.updateMatrixWorld(true);
    }

    if (jointTemplateModel) {
      applyCatalogEntryTransform(root, entry);
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

    if (jointHardware || keepNativeJointScale) {
      // Крепёж стыка: catalog rot не трогаем — ось задаёт furniture rot в дереве.
      centerOnlyKeepScale(root);
      return root;
    }

    const finishFlags = {
      jointHardware: false,
      jointTemplateModel: false,
      roomHandle,
      supportLegLike,
      fitToSize,
      sizeMmY: Number(sizeMm?.y) || 0,
    };

    if (handleLike && fitToSize && !roomHandle) {
      const impH = inferFileToMmScaleFromMeshes(root, mergedSpec);
      root.scale.setScalar(impH);
      root.updateMatrixWorld(true);
      scaleHandleVolnaToPrepMm(root, cardSizeMmForHandlePrep(entry, sizeMm));
      root.userData._cldHandleScalePrepared = true;
      finishPrepareWithCatalogCardTransform(root, entry, mergedSpec, finishFlags);
      return root;
    }

    const entryParams = entry?.params && typeof entry.params === 'object' ? entry.params : {};
    const meshMap = entryParams.meshes || null;
    const useWholeSlotFit = slotFitHasRules(readSlotFit(entryParams));
    const useMeshVertexSizing = !useWholeSlotFit && meshMapHasSizeRules(meshMap);

    // 1) import units → mm (реф: scale на вершинах / Model_utils.set_scale)
    const imp = inferFileToMmScale(root, mergedSpec);
    root.scale.setScalar(imp);
    root.updateMatrixWorld(true);

    // 2) catalog params.scale (админка: 100 = 100%)
    if (!roomHandle) {
      const catSc = catalogScaleVec(entry);
      if (catSc && (catSc.x !== 1 || catSc.y !== 1 || catSc.z !== 1)) {
        root.scale.multiply(new THREE.Vector3(catSc.x, catSc.y, catSc.z));
        root.updateMatrixWorld(true);
      }
    }

    // 3) size/fit при rot=0 (реф _set_model3d_size временно снимает rotation)
    const hangFromTop =
      mergedSpec?.isRodCompanion === true && mergedSpec?.rodHangFromTop === true;
    if (mergedSpec?.rodHangStrip === true) root.userData.rodHangStrip = true;

    if (useMeshVertexSizing) {
      bakeMeshesToRootLocal(root);
      root.scale.set(1, 1, 1);
      root.position.set(0, 0, 0);
      root.updateMatrixWorld(true);
      applyCabinetModelMeshVertexSizing(root, entryParams, resolveSlotTargetSizeMm(sizeMm, refMm));
    } else if (useWholeSlotFit) {
      applyWholeObjectSlotFit(root, entryParams, resolveSlotTargetSizeMm(sizeMm, refMm));
    } else if (refMm) {
      if (hangFromTop) scaleAndHangFromTopMm(root, refMm);
      else scaleAndCenterToRefMm(root, refMm);
    } else if (fitToSize && roomHandle) {
      centerOnlyKeepScale(root);
    } else if (fitToSize) {
      if (hangFromTop) scaleAndHangFromTopMm(root, sizeMm);
      else scaleAndCenterToRefMm(root, sizeMm);
    } else if (hangFromTop) {
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

    // 4) card pos + rot — ВСЕГДА (реф own_object.translate + rotate после size)
    finishPrepareWithCatalogCardTransform(root, entry, mergedSpec, finishFlags);
    return root;
  }