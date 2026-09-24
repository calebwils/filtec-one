import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sortProductsNaturally } from '@/lib/catalogueUtils';

export async function GET() {
  try {
    const [
      products,
      dealers,
      employees,
      plumbers,
      orders,
      settingsRows,
      leaveRequests,
      dailyAttendance,
      attendanceRecords,
      rewardLedger,
      auditLogs,
      integrationEvents,
      users,
      rewardVouchers
    ] = await Promise.all([
      prisma.product.findMany({
        include: { variants: true }
      }),
      prisma.dealer.findMany({ orderBy: { code: 'asc' } }),
      prisma.employee.findMany({ orderBy: { code: 'asc' } }),
      prisma.plumber.findMany({ orderBy: { name: 'asc' } }),
      prisma.order.findMany({
        include: { items: true },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.appSetting.findMany(),
      prisma.leaveRequest.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.dailyAttendanceSummary.findMany({ orderBy: { date: 'desc' } }),
      prisma.attendanceRecord.findMany({ orderBy: { timestamp: 'desc' }, take: 200 }),
      prisma.rewardTransaction.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }),
      prisma.integrationEvent.findMany({ orderBy: { timestamp: 'desc' }, take: 100 }),
      prisma.user.findMany(),
      prisma.rewardVoucher.findMany({ orderBy: { createdAt: 'desc' } })
    ]);

    // Parse JSON fields into proper JS objects/arrays
    const parsedProducts = sortProductsNaturally(
      products.map((p) => ({
        ...p,
        tags: p.tags ? JSON.parse(p.tags) : []
      }))
    );

    const parsedEmployees = employees.map((e) => ({
      ...e,
      assignedDealerIds: e.assignedDealerIds ? JSON.parse(e.assignedDealerIds) : [],
      allowedPages: e.allowedPages ? JSON.parse(e.allowedPages) : []
    }));

    const parsedUsers = users.map((u) => ({
      ...u,
      allowedPages: u.allowedPages ? JSON.parse(u.allowedPages) : []
    }));

    const parsedDailyAttendance = dailyAttendance.map((d) => ({
      ...d,
      checkIn: d.checkInJson ? JSON.parse(d.checkInJson) : undefined,
      checkOut: d.checkOutJson ? JSON.parse(d.checkOutJson) : undefined
    }));

    const settingsMap: Record<string, any> = {};
    for (const s of settingsRows) {
      try {
        settingsMap[s.key] = JSON.parse(s.value);
      } catch {
        settingsMap[s.key] = s.value;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        products: parsedProducts,
        dealers,
        employees: parsedEmployees,
        users: parsedUsers,
        plumbers,
        orders,
        settings: settingsMap,
        leaveRequests,
        dailyAttendance: parsedDailyAttendance,
        rewardLedger,
        auditLogs,
        integrationEvents,
        rewardVouchers
      }
    });
  } catch (error: any) {
    console.error('API /api/data error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to query database' },
      { status: 500 }
    );
  }
}

// Handler to persist changes directly to PostgreSQL
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'UPDATE_SETTINGS': {
        if (payload.settings) {
          const updates = [];
          for (const [key, value] of Object.entries(payload.settings)) {
            updates.push(
              prisma.appSetting.upsert({
                where: { key },
                update: { value: JSON.stringify(value) },
                create: { key, value: JSON.stringify(value) }
              })
            );
          }
          await Promise.all(updates);
          return NextResponse.json({ success: true });
        }
        const { key, value } = payload;
        const updated = await prisma.appSetting.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) }
        });
        return NextResponse.json({ success: true, setting: updated });
      }

      case 'CREATE_DEALER': {
        const { ...dealerData } = payload;
        const created = await prisma.dealer.create({
          data: {
            id: dealerData.id,
            code: dealerData.code,
            name: dealerData.name,
            ownerName: dealerData.ownerName,
            phone: dealerData.phone,
            email: dealerData.email || null,
            city: dealerData.city,
            state: dealerData.state || 'Odisha',
            address: dealerData.address,
            pincode: dealerData.pincode || null,
            gstin: dealerData.gstin || null,
            creditLimit: Number(dealerData.creditLimit) || 0,
            outstandingBalance: Number(dealerData.outstandingBalance) || 0,
            tier: dealerData.tier || 'Silver',
            totalPurchases: Number(dealerData.totalPurchases) || 0,
            availableRewards: Number(dealerData.availableRewards) || 0,
            plumbersCount: Number(dealerData.plumbersCount) || 0,
            assignedRepId: dealerData.assignedRepId || null
          }
        });
        return NextResponse.json({ success: true, dealer: created });
      }

      case 'UPDATE_DEALER': {
        const { id, createdAt, updatedAt, ...dealerData } = payload;
        const dataToUpdate: any = { ...dealerData };
        if (dealerData.gstin !== undefined) dataToUpdate.gstin = dealerData.gstin || null;
        if (dealerData.email !== undefined) dataToUpdate.email = dealerData.email || null;
        if (dealerData.pincode !== undefined) dataToUpdate.pincode = dealerData.pincode || null;

        const updated = await prisma.dealer.update({
          where: { id },
          data: dataToUpdate
        });
        return NextResponse.json({ success: true, dealer: updated });
      }

      case 'UPDATE_EMPLOYEE': {
        const { id, systemRole, allowedPages, assignedDealerIds, createdAt, updatedAt, ...rest } = payload;
        const dataToUpdate: any = { ...rest };
        if (systemRole !== undefined) dataToUpdate.systemRole = systemRole;
        if (allowedPages !== undefined) {
          dataToUpdate.allowedPages = typeof allowedPages === 'string' ? allowedPages : JSON.stringify(allowedPages);
        }
        if (assignedDealerIds !== undefined) {
          dataToUpdate.assignedDealerIds = typeof assignedDealerIds === 'string' ? assignedDealerIds : JSON.stringify(assignedDealerIds);
        }

        const updated = await prisma.employee.update({
          where: { id },
          data: dataToUpdate
        });

        // Also sync User record if matching phone/code exists
        if (updated.phone) {
          await prisma.user.updateMany({
            where: { phone: updated.phone },
            data: {
              role: updated.systemRole,
              allowedPages: updated.allowedPages
            }
          });
        }
        return NextResponse.json({ success: true, employee: updated });
      }

      case 'CREATE_EMPLOYEE': {
        const { id, code, name, phone, systemRole, allowedPages, assignedDealerIds, ...rest } = payload;
        const created = await prisma.employee.create({
          data: {
            id,
            code,
            name,
            phone,
            systemRole: systemRole || 'EMPLOYEE',
            allowedPages: typeof allowedPages === 'string' ? allowedPages : JSON.stringify(allowedPages || []),
            assignedDealerIds: typeof assignedDealerIds === 'string' ? assignedDealerIds : JSON.stringify(assignedDealerIds || []),
            ...rest
          }
        });
        return NextResponse.json({ success: true, employee: created });
      }

      case 'UPDATE_PLUMBER': {
        const { id, createdAt, updatedAt, ...data } = payload;
        const updated = await prisma.plumber.update({
          where: { id },
          data
        });
        return NextResponse.json({ success: true, plumber: updated });
      }

      case 'CREATE_PLUMBER': {
        const { unlockedEscrow, ...plumberData } = payload;
        const created = await prisma.plumber.create({
          data: plumberData
        });
        if (payload.dealerId) {
          await prisma.dealer.update({
            where: { id: payload.dealerId },
            data: {
              plumbersCount: { increment: 1 },
              pendingPlumberRewards: 0
            }
          }).catch(() => null);
        }
        return NextResponse.json({ success: true, plumber: created });
      }

      case 'UPDATE_PRODUCT': {
        const { id, tags, variants, createdAt, updatedAt, ...data } = payload;
        const updated = await prisma.product.update({
          where: { id },
          data: {
            ...data,
            tags: tags ? JSON.stringify(tags) : undefined
          }
        });
        return NextResponse.json({ success: true, product: updated });
      }

      case 'TOGGLE_PRODUCT_STOCK': {
        const { productId, inStock } = payload;
        const updated = await prisma.product.update({
          where: { id: productId },
          data: {
            inStock,
            stockStatus: inStock ? 'IN_STOCK' : 'OUT_OF_STOCK'
          }
        });
        await prisma.productVariant.updateMany({
          where: { productId },
          data: { inStock }
        });
        return NextResponse.json({ success: true, product: updated });
      }

      case 'UPDATE_VARIANT_STOCK': {
        const { productId, variantId, inStock } = payload;
        await prisma.productVariant.update({
          where: { id: variantId },
          data: { inStock }
        });
        const variants = await prisma.productVariant.findMany({ where: { productId } });
        const anyInStock = variants.some((v) => v.inStock);
        await prisma.product.update({
          where: { id: productId },
          data: {
            inStock: anyInStock,
            stockStatus: anyInStock ? 'IN_STOCK' : 'OUT_OF_STOCK'
          }
        });
        return NextResponse.json({ success: true });
      }

      case 'CREATE_PRODUCT': {
        const { variants, tags, ...prodData } = payload;
        const created = await prisma.product.create({
          data: {
            ...prodData,
            tags: tags ? JSON.stringify(tags) : '[]',
            variants: variants && variants.length > 0 ? {
              create: variants.map((v: any) => ({
                id: v.id,
                length: v.length || null,
                size: v.size || null,
                mrp: v.mrp || 0,
                packingQty: v.packingQty || 1,
                packingUnit: v.packingUnit || 'Pcs',
                inStock: v.inStock !== false
              }))
            } : undefined
          },
          include: { variants: true }
        });
        return NextResponse.json({ success: true, product: created });
      }

      case 'DELETE_PRODUCT': {
        const { productId } = payload;
        await prisma.product.delete({
          where: { id: productId }
        });
        return NextResponse.json({ success: true });
      }

      case 'CREATE_ORDER': {
        const { items, ...orderData } = payload;
        const created = await prisma.order.create({
          data: {
            ...orderData,
            items: {
              create: (items || []).map((it: any) => ({
                id: it.id,
                productId: it.productId,
                productCode: it.productCode,
                productName: it.productName,
                variantId: it.variantId,
                variantDescription: it.variantDescription,
                unitPrice: it.unitPrice,
                quantity: it.quantity,
                packingQty: it.packingQty,
                packingUnit: it.packingUnit,
                totalAmount: it.totalAmount
              }))
            }
          },
          include: { items: true }
        });
        return NextResponse.json({ success: true, order: created });
      }

      case 'APPROVE_ORDER': {
        const { orderId, adminNotes, invoiceNumber, approvedAt, confirmedAt, dealerId, rewardDealerShare, subtotal } = payload;
        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'CONFIRMED',
            adminNotes: adminNotes || null,
            invoiceNumber: invoiceNumber || null,
            approvedAt: approvedAt || new Date().toISOString(),
            confirmedAt: confirmedAt || new Date().toISOString(),
            erpSyncAt: new Date().toISOString(),
            invoicedAt: new Date().toISOString()
          }
        });

        if (dealerId) {
          const currentDealer = await prisma.dealer.findUnique({ where: { id: dealerId } });
          if (currentDealer) {
            await prisma.dealer.update({
              where: { id: dealerId },
              data: {
                totalPurchases: currentDealer.totalPurchases + (subtotal || 0),
                availableRewards: currentDealer.availableRewards + (rewardDealerShare || 0)
              }
            });

            if (rewardDealerShare > 0) {
              await prisma.rewardTransaction.create({
                data: {
                  id: `rew-${Date.now()}`,
                  dealerId,
                  orderId: updatedOrder.id,
                  orderNumber: updatedOrder.orderNumber,
                  type: 'CREDIT_ORDER',
                  amount: rewardDealerShare,
                  balanceAfter: currentDealer.availableRewards + rewardDealerShare,
                  description: `Reward points from Order ${updatedOrder.orderNumber}`,
                  createdAt: new Date()
                }
              });
            }
          }
        }
        return NextResponse.json({ success: true, order: updatedOrder });
      }

      case 'RELEASE_ORDER': {
        const { orderId, invoiceNumber, invoiceDate, invoiceValue, dealerReward, plumberReward, plumberId, dealerId } = payload;
        const now = new Date();

        const updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'COMPLETED',
            confirmedAt: now.toISOString(),
            invoicedAt: invoiceDate || now.toISOString().split('T')[0],
            invoiceNumber: invoiceNumber || undefined,
            invoiceDate: invoiceDate || undefined,
            invoiceValue: typeof invoiceValue === 'number' ? invoiceValue : undefined,
            rewardEstimated: (Number(dealerReward) || 0) + (Number(plumberReward) || 0),
            rewardDealerShare: Number(dealerReward) || 0,
            rewardPlumberShare: Number(plumberReward) || 0
          }
        });

        // Update dealer purchases and available rewards
        let targetDealer = dealerId ? await prisma.dealer.findUnique({ where: { id: dealerId } }).catch(() => null) : null;
        if (!targetDealer && (dealerId || updatedOrder.dealerName)) {
          targetDealer = await prisma.dealer.findFirst({
            where: {
              OR: [
                ...(dealerId ? [{ code: dealerId }] : []),
                ...(updatedOrder.dealerName ? [{ name: updatedOrder.dealerName }] : [])
              ]
            }
          }).catch(() => null);
        }

        const effectiveDealerId = targetDealer?.id || dealerId || updatedOrder.dealerId || 'dlr-unknown';
        const currentBalance = targetDealer?.availableRewards || 0;

        if (targetDealer) {
          await prisma.dealer.update({
            where: { id: targetDealer.id },
            data: {
              totalPurchases: targetDealer.totalPurchases + (Number(invoiceValue) || 0),
              availableRewards: targetDealer.availableRewards + (Number(dealerReward) || 0)
            }
          }).catch((err) => console.warn('Failed to update dealer balance:', err));
        }

        if (dealerReward > 0) {
          await prisma.rewardTransaction.create({
            data: {
              id: `rew-${Date.now()}-dlr`,
              dealerId: effectiveDealerId,
              orderId,
              orderNumber: updatedOrder.orderNumber,
              type: 'CREDIT_ORDER',
              amount: Number(dealerReward),
              balanceAfter: currentBalance + Number(dealerReward),
              description: `1% Reward from Order ${updatedOrder.orderNumber} (Invoice #${invoiceNumber})`
            }
          }).catch((err) => console.warn('Failed to create dealer reward transaction:', err));
        }

        // Update plumber reward
        let targetPlumber = plumberId ? await prisma.plumber.findUnique({ where: { id: plumberId } }).catch(() => null) : null;
        if (!targetPlumber && effectiveDealerId) {
          targetPlumber = await prisma.plumber.findFirst({
            where: { dealerId: effectiveDealerId, status: 'ACTIVE' }
          }).catch(() => null);
        }

        if (targetPlumber && plumberReward > 0) {
          await prisma.plumber.update({
            where: { id: targetPlumber.id },
            data: {
              totalAllocatedRewards: targetPlumber.totalAllocatedRewards + Number(plumberReward),
              rewardHistoryCount: targetPlumber.rewardHistoryCount + 1
            }
          }).catch(() => null);

          await prisma.rewardTransaction.create({
            data: {
              id: `rew-${Date.now()}-plm`,
              dealerId: effectiveDealerId,
              orderId,
              orderNumber: updatedOrder.orderNumber,
              plumberId: targetPlumber.id,
              plumberName: targetPlumber.name,
              type: 'PLUMBER_REWARD',
              amount: Number(plumberReward),
              balanceAfter: (targetPlumber.totalAllocatedRewards || 0) + Number(plumberReward),
              description: `1% Reward to Plumber ${targetPlumber.name} from Order ${updatedOrder.orderNumber} (Invoice #${invoiceNumber})`
            }
          }).catch(() => null);
        } else if (plumberReward > 0) {
          // Dealer has no plumbers: Plumber reward stays in escrow and NEVER goes to the dealer!
          if (targetDealer) {
            await prisma.dealer.update({
              where: { id: targetDealer.id },
              data: {
                pendingPlumberRewards: ((targetDealer as any).pendingPlumberRewards || 0) + Number(plumberReward)
              }
            }).catch(() => null);
          }

          await prisma.rewardTransaction.create({
            data: {
              id: `rew-${Date.now()}-plm-esc`,
              dealerId: effectiveDealerId,
              orderId,
              orderNumber: updatedOrder.orderNumber,
              type: 'PLUMBER_REWARD_ESCROW',
              amount: Number(plumberReward),
              balanceAfter: ((targetDealer as any)?.pendingPlumberRewards || 0) + Number(plumberReward),
              description: `Plumber Reward held in escrow — dealer has no registered plumbers. Stays in pool until plumber is onboarded. (Invoice #${invoiceNumber})`
            }
          }).catch(() => null);
        }

        return NextResponse.json({ success: true, order: updatedOrder });
      }

      case 'REJECT_ORDER': {
        const { orderId, rejectionReason } = payload;
        const updated = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: 'REJECTED',
            rejectionReason
          }
        });
        return NextResponse.json({ success: true, order: updated });
      }

      case 'CREATE_LEAVE_REQUEST': {
        const created = await prisma.leaveRequest.create({
          data: {
            id: payload.id,
            employeeId: payload.employeeId,
            employeeName: payload.employeeName,
            leaveType: payload.leaveType,
            startDate: payload.startDate,
            endDate: payload.endDate,
            daysCount: Number(payload.daysCount) || 1,
            reason: payload.reason,
            status: payload.status || 'PENDING',
            isHalfDay: Boolean(payload.isHalfDay),
            contactNumber: payload.contactNumber || null
          }
        });
        return NextResponse.json({ success: true, leaveRequest: created });
      }

      case 'UPDATE_LEAVE_REQUEST': {
        const { id, status, rejectionReason } = payload;
        const updated = await prisma.leaveRequest.update({
          where: { id },
          data: {
            status,
            rejectionReason: rejectionReason || null
          }
        });
        return NextResponse.json({ success: true, leaveRequest: updated });
      }

      case 'RECORD_ATTENDANCE': {
        const { record, employeeId, checkInStatus, lastCheckInTime, lastLocation, summary } = payload;
        try {
          if (record) {
            await prisma.attendanceRecord.upsert({
              where: { id: record.id },
              update: {
                employeeId: record.employeeId,
                employeeName: record.employeeName,
                type: record.type,
                latitude: record.latitude || 0,
                longitude: record.longitude || 0,
                locationName: record.locationName || '',
                photoUrl: record.photoUrl || '',
                verified: record.verified !== false,
                distanceFromOffice: record.distanceFromOffice !== undefined ? Number(record.distanceFromOffice) : null
              },
              create: {
                id: record.id,
                employeeId: record.employeeId,
                employeeName: record.employeeName,
                type: record.type,
                latitude: record.latitude || 0,
                longitude: record.longitude || 0,
                locationName: record.locationName || '',
                photoUrl: record.photoUrl || '',
                verified: record.verified !== false,
                distanceFromOffice: record.distanceFromOffice !== undefined ? Number(record.distanceFromOffice) : null
              }
            });
          }
        } catch (recErr) {
          console.warn('Could not insert attendanceRecord in DB:', recErr);
        }

        try {
          if (summary) {
            const checkInJson = summary.checkIn ? JSON.stringify(summary.checkIn) : null;
            const checkOutJson = summary.checkOut ? JSON.stringify(summary.checkOut) : null;
            await prisma.dailyAttendanceSummary.upsert({
              where: { id: summary.id },
              update: {
                date: summary.date,
                status: summary.status,
                checkInJson: checkInJson || undefined,
                checkOutJson: checkOutJson || undefined,
                hoursWorked: summary.hoursWorked || 0,
                dealerVisitsCount: summary.dealerVisitsCount || 0,
                ordersCount: summary.ordersCount || 0,
                notes: summary.notes || null,
                phone: summary.phone || undefined,
                territory: summary.territory || undefined
              },
              create: {
                id: summary.id,
                date: summary.date,
                employeeId: summary.employeeId,
                employeeCode: summary.employeeCode,
                employeeName: summary.employeeName,
                territory: summary.territory || 'Field Operations',
                phone: summary.phone || '',
                status: summary.status,
                checkInJson,
                checkOutJson,
                hoursWorked: summary.hoursWorked || 0,
                dealerVisitsCount: summary.dealerVisitsCount || 0,
                ordersCount: summary.ordersCount || 0,
                notes: summary.notes || null
              }
            });
          }
        } catch (sumErr) {
          console.warn('Could not upsert dailyAttendanceSummary in DB:', sumErr);
        }

        try {
          if (employeeId) {
            const cleanEmpId = String(employeeId).replace(/^user-/, '');
            await prisma.employee.updateMany({
              where: {
                OR: [
                  { id: employeeId },
                  { id: cleanEmpId },
                  { code: employeeId }
                ]
              },
              data: {
                checkInStatus: checkInStatus || undefined,
                lastCheckInTime: lastCheckInTime || undefined,
                lastLocation: lastLocation || undefined
              }
            });
          }
        } catch (empErr) {
          console.warn('Could not update employee status in DB:', empErr);
        }

        return NextResponse.json({ success: true, summary });
      }

      case 'ALLOCATE_PLUMBER_REWARD': {
        const { dealerId, plumberId, points, source, voucher } = payload;
        let dealer = await prisma.dealer.findFirst({
          where: { OR: [{ id: dealerId }, { code: dealerId }] }
        });
        if (!dealer) {
          dealer = await prisma.dealer.findFirst();
        }
        let plumber = await prisma.plumber.findUnique({ where: { id: plumberId } });
        if (!plumber) {
          plumber = await prisma.plumber.upsert({
            where: { id: plumberId },
            update: {},
            create: {
              id: plumberId,
              dealerId: dealer?.id || dealerId,
              dealerName: dealer?.name || 'Maa Tarini',
              name: voucher?.plumberName || 'PLUMBER 1',
              phone: voucher?.plumberPhone || '+91 0000011111',
              status: 'ACTIVE',
              totalAllocatedRewards: points || 0,
              rewardHistoryCount: 1,
              dateAdded: new Date().toISOString().split('T')[0]
            }
          });
        }
        if (dealer && plumber) {
          if (source === 'DEALER_ACCOUNT') {
            const newBalance = Math.max(0, Number((dealer.availableRewards - points).toFixed(2)));
            await prisma.dealer.update({
              where: { id: dealer.id },
              data: { availableRewards: newBalance }
            });
            await prisma.plumber.update({
              where: { id: plumberId },
              data: {
                totalAllocatedRewards: Number((plumber.totalAllocatedRewards + points).toFixed(2)),
                rewardHistoryCount: plumber.rewardHistoryCount + 1
              }
            });
            await prisma.rewardTransaction.create({
              data: {
                id: `rew-${Date.now()}`,
                dealerId: dealer.id,
                plumberId,
                plumberName: plumber.name,
                type: 'DEBIT_PLUMBER_ALLOCATION',
                amount: -points,
                balanceAfter: newBalance,
                description: `Reward points transfer from Dealer Account to Plumber ${plumber.name} (Voucher ${voucher?.voucherNumber || 'P-xxx'})`,
                createdAt: new Date()
              }
            });
          } else if (source === 'ESCROW') {
            const newEscrow = Math.max(0, Number((((dealer as any).pendingPlumberRewards || 0) - points).toFixed(2)));
            await prisma.dealer.update({
              where: { id: dealer.id },
              data: { pendingPlumberRewards: newEscrow }
            });
            await prisma.plumber.update({
              where: { id: plumberId },
              data: {
                totalAllocatedRewards: Number((plumber.totalAllocatedRewards + points).toFixed(2)),
                rewardHistoryCount: plumber.rewardHistoryCount + 1
              }
            });
            await prisma.rewardTransaction.create({
              data: {
                id: `rew-${Date.now()}`,
                dealerId: dealer.id,
                plumberId,
                plumberName: plumber.name,
                type: 'ESCROW_RELEASE',
                amount: points,
                balanceAfter: newEscrow,
                description: `Released ₹${points} from Escrow to Plumber ${plumber.name} (Voucher ${voucher?.voucherNumber || 'P-xxx'})`,
                createdAt: new Date()
              }
            });
          } else {
            // Default: PLUMBER_POOL
            const remainingBalance = Math.max(0, Number((plumber.totalAllocatedRewards - points).toFixed(2)));
            await prisma.rewardTransaction.create({
              data: {
                id: `rew-${Date.now()}`,
                dealerId: dealer.id,
                plumberId,
                plumberName: plumber.name,
                type: 'PLUMBER_REDEEM_VOUCHER',
                amount: -points,
                balanceAfter: remainingBalance,
                description: `Issued Plumber Reward Coupon ${voucher?.voucherNumber || 'P-001'} for ₹${points} to ${plumber.name}`,
                createdAt: new Date()
              }
            });
          }

          if (voucher) {
            await prisma.rewardVoucher.upsert({
              where: { voucherNumber: voucher.voucherNumber },
              update: {
                status: voucher.status || 'ISSUED',
                points: Number(voucher.points) || points,
                amount: Number(voucher.amount) || points,
                dealerId: dealer.id,
                dealerName: dealer.name,
                dealerCode: dealer.code,
                plumberId: plumber.id,
                plumberName: plumber.name,
                plumberPhone: plumber.phone,
                dateRedeemed: voucher.dateRedeemed || new Date().toISOString().split('T')[0],
                contactNumber: voucher.contactNumber || '+91 94378 60479',
                instructions: voucher.instructions || null
              },
              create: {
                id: voucher.id || `vouch-p-${Date.now()}`,
                voucherNumber: voucher.voucherNumber,
                type: 'PLUMBER',
                dealerId: dealer.id,
                dealerName: dealer.name,
                dealerCode: dealer.code,
                plumberId: plumber.id,
                plumberName: plumber.name,
                plumberPhone: plumber.phone,
                points: Number(voucher.points) || points,
                amount: Number(voucher.amount) || points,
                status: voucher.status || 'ISSUED',
                dateRedeemed: voucher.dateRedeemed || new Date().toISOString().split('T')[0],
                contactNumber: voucher.contactNumber || '+91 94378 60479',
                instructions: voucher.instructions || null
              }
            }).catch((err) => console.warn('Failed to upsert plumber reward voucher in DB:', err));
          }
        }
        return NextResponse.json({ success: true });
      }

      case 'DEALER_REDEEM_REWARD': {
        const { dealerId, points, voucherNumber, voucher } = payload;
        const dealer = await prisma.dealer.findFirst({
          where: { OR: [{ id: dealerId }, { code: dealerId }] }
        });
        if (dealer) {
          const newBalance = Math.max(0, Number((dealer.availableRewards - points).toFixed(2)));
          await prisma.dealer.update({
            where: { id: dealer.id },
            data: { availableRewards: newBalance }
          });
          await prisma.rewardTransaction.create({
            data: {
              id: `rew-${Date.now()}`,
              dealerId: dealer.id,
              type: 'DEALER_REDEEM_VOUCHER',
              amount: -points,
              balanceAfter: newBalance,
              description: `Redeemed Voucher ${voucherNumber || 'D-001'} for Credit Note Settlement`,
              createdAt: new Date()
            }
          });

          const v = voucher;
          const vNum = v?.voucherNumber || voucherNumber || 'D-001';
          await prisma.rewardVoucher.upsert({
            where: { voucherNumber: vNum },
            update: {
              status: v?.status || 'ISSUED',
              points: Number(points),
              amount: Number(points),
              dealerId: dealer.id,
              dealerName: dealer.name,
              dealerCode: dealer.code,
              contactNumber: v?.contactNumber || '+91 94378 60479',
              instructions: v?.instructions || null
            },
            create: {
              id: v?.id || `vouch-d-${Date.now()}`,
              voucherNumber: vNum,
              type: 'DEALER',
              dealerId: dealer.id,
              dealerName: dealer.name,
              dealerCode: dealer.code,
              points: Number(points),
              amount: Number(points),
              status: v?.status || 'ISSUED',
              dateRedeemed: v?.dateRedeemed || new Date().toISOString().split('T')[0],
              contactNumber: v?.contactNumber || '+91 94378 60479',
              instructions: v?.instructions || `Present this voucher to your FILTEC Area Sales Executive or contact Head Office (+91 94378 60479) to settle as Credit Note.`
            }
          }).catch((err) => console.warn('Failed to upsert dealer reward voucher in DB:', err));
        }
        return NextResponse.json({ success: true });
      }

      case 'SETTLE_VOUCHER': {
        const { voucherId, voucherNumber, paymentMode, paymentReference, creditNoteNumber, settledBy, notes } = payload;
        const now = new Date();
        const settledAt = now.toISOString();

        const existing = await prisma.rewardVoucher.findFirst({
          where: {
            OR: [
              { id: voucherId },
              ...(voucherNumber ? [{ voucherNumber }] : [])
            ]
          }
        });

        let updatedVoucher;
        if (existing) {
          updatedVoucher = await prisma.rewardVoucher.update({
            where: { id: existing.id },
            data: {
              status: 'SETTLED',
              paymentMode: paymentMode || 'CREDIT_NOTE',
              paymentReference: paymentReference || creditNoteNumber || null,
              creditNoteNumber: creditNoteNumber || (paymentMode === 'CREDIT_NOTE' ? paymentReference : null),
              settledAt,
              settledBy: settledBy || 'Admin'
            }
          });
        }

        const desc = `Settled ${existing?.type || 'Reward'} Voucher ${existing?.voucherNumber || voucherNumber} (₹${existing?.amount || payload.amount}) via ${paymentMode || 'Credit Note'} [Ref: ${paymentReference || creditNoteNumber || 'N/A'}] by ${settledBy || 'Admin'}`;

        await prisma.rewardTransaction.create({
          data: {
            id: `rew-settle-${Date.now()}`,
            dealerId: existing?.dealerId || 'admin',
            plumberId: existing?.plumberId || null,
            plumberName: existing?.plumberName || null,
            type: 'SETTLEMENT_PAYOUT',
            amount: 0,
            balanceAfter: 0,
            description: desc,
            createdAt: now
          }
        }).catch((err) => console.warn('Settlement reward transaction log error:', err));

        await prisma.auditLog.create({
          data: {
            id: `aud-${Date.now()}`,
            userId: 'admin',
            userName: settledBy || 'Admin',
            role: 'ADMIN',
            action: 'VOUCHER_SETTLED',
            entityType: 'REWARD',
            entityId: existing?.id || voucherId,
            details: desc,
            timestamp: settledAt
          }
        }).catch((err) => console.warn('Settlement audit log error:', err));

        return NextResponse.json({ success: true, voucher: updatedVoucher });
      }

      default:
        return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('API /api/data POST error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
